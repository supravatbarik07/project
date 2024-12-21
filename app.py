import os
import cx_Oracle
from flask import Flask, request, jsonify,render_template
from flask_cors import CORS
import requests
import openpyxl
import tempfile

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Set your verification token
VERIFY_TOKEN = 'your_verify_token_here'  # Replace with your actual token


# WhatsApp API configurations
WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0/428645750337871/messages'
ACCESS_TOKEN = 'EAAPOHcHRIdcBO1dHhaCMYFAouIU1VnESVHEv8rxvAMM2oAFkH9DErPDuZBtKjPdZCL0r2NhCiTqYllWWQNF1vHyTiFzCKZBjH2DIZC6PKC74Quibsd3JRx1ramV2iuWGih0cFGc9IRG5rPB2iqM9zZC0rZCepFc7uZAx0CpkgWsnfSXsqpZCqumLY1QIds1iCTfo81ZChg4kwh8jCZAQJqab0zCoLF34IZD'
PHONE_NUMBER_ID = '389615060912251'


# PostgreSQL Database connection details
DB_CONFIG = {
    'user': 'c##supravat',
    'password': 'supravat',
    'dsn': 'orcl',  # Replace 'XEPDB1' with your Oracle Service Name
    'encoding': 'UTF-8'
}


# Function to get a database connection
def get_db_connection():
    try:
        connection = cx_Oracle.connect(**DB_CONFIG)
        return connection
    except cx_Oracle.Error as e:
        print(f"Database connection error: {e}")
        raise

# Function to check if the phone number is opt-in
def is_opt_in(phone_number):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Remove non-digit characters and normalize the phone number
        normalized_phone_number = ''.join(filter(str.isdigit, phone_number))  # Keep only digits
        
        print(f"Validating phone number: {normalized_phone_number}")

        # Check if the phone number exists in the employee_details table
        check_employee_query = '''
            SELECT employee_id 
            FROM employee_details 
            WHERE phone_number = :phone_number
        '''
        cursor.execute(check_employee_query, {"phone_number": normalized_phone_number})
        employee = cursor.fetchone()

        if not employee:
            # Phone number not found in employee_details table
            print(f"{normalized_phone_number}: Doesn't belongs to our organization")
            cursor.close()
            connection.close()
            return {"status": False, "message": "This number can't be found in our employee table."}

        employee_id = employee[0]

        # Check if the phone number is already in the employee_opt_in table
        check_opt_in_query = '''
            SELECT opt_in_status 
            FROM employee_opt_in 
            WHERE employee_id = :employee_id
        '''
        cursor.execute(check_opt_in_query, {"employee_id": employee_id})
        opt_in = cursor.fetchone()

        if not opt_in:
            # Phone number not in opt_in table, insert it as opt_in
            insert_opt_in_query = '''
                INSERT INTO employee_opt_in (employee_id, opt_in_status) 
                VALUES (:employee_id, 'opt_in')
            '''
            cursor.execute(insert_opt_in_query, {"employee_id": employee_id})
            connection.commit()
            print(f"Phone number {normalized_phone_number} added to opt-in table.")
            cursor.close()
            connection.close()
            return {"status": True, "message": "Phone number successfully added to opt-in."}

        # Phone number already opted in
        cursor.close()
        connection.close()
        return {"status": True, "message": "Phone number is already opted in."}
    except cx_Oracle.Error as e:
        print(f"Database error: {e}")
        return {"status": False, "message": f"Database error: {e}"}

# Function to send a template message via WhatsApp API
def send_whatsapp_template_message(phone_number, template_name):
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": "en_US"
            }
        }
    }
    response = requests.post(WHATSAPP_API_URL, headers=headers, json=data)
    response_data = response.json()
    if response.status_code != 200 or 'error' in response_data:
        error_message = response_data.get('error', {}).get('message', 'Unknown error occurred')
        print(f"Error sending template message to {phone_number}: {error_message}")
        return {"status": False, "error": error_message}

    return {"status": True, "response": response_data}

# Function to send a plain text message via WhatsApp API
def send_whatsapp_text_message(phone_number, message):
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message
        }
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }

    response = requests.post(WHATSAPP_API_URL, headers=headers, json=data)
    response_data = response.json()

    if response.status_code != 200 or 'error' in response_data:
        error_message = response_data.get('error', {}).get('message', 'Unknown error occurred')
        print(f"Error sending text message to {phone_number}: {error_message}")
        return {"status": False, "error": error_message}
    return {"status": True, "response": response_data}

# Webhook endpoint for verification
@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        # Extract parameters from the request
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')

        # Check if the mode and token are valid
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            return challenge, 200  # Return the challenge to verify the webhook
        else:
            return jsonify({"error": "Invalid token or mode"}), 403

    elif request.method == 'POST':
        # Process incoming messages here
        data = request.get_json()
        print(f"Incoming webhook data: {data}")
        return jsonify({"status": "received"}), 200

@app.route('/')
def index():
    return render_template('index.html')

# Endpoint to fetch available WhatsApp templates
@app.route('/templates', methods=['GET'])
def get_templates():
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}'
    }
    response = requests.get(f'https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/message_templates', headers=headers)
    response_data = response.json()
    if response.status_code == 200:
        templates = response.json().get('data', [])
        default_template = "hello_world"
        template_names = [template['name'] for template in templates]
        if default_template not in template_names:
            template_names.append(default_template)
        return jsonify({"templates": template_names})
    else:
        # Log the error details for debugging
       error_message = response_data.get('error', {}).get('message', 'Unknown error occurred')
       print(f"Error fetching templates: {error_message}")
       return jsonify({"error": error_message}), 500

   # Endpoint to send a template message
@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.get_json()
    phone_number = data.get('phone_number')
    template_name = data.get('template_name')

    if not template_name:
        return jsonify({"error": "Template name is required"}), 400

    # Validate phone number and handle opt-in logic
    opt_in_status = is_opt_in(phone_number)
    if not opt_in_status["status"]:
        return jsonify({"error": opt_in_status["message"]}), 400

    response = send_whatsapp_template_message(phone_number, template_name)


    if not response["status"]:
        return jsonify({"error": response["error"]}), 400
    # Print response to console
    print(f"Response from WhatsApp API for {phone_number}: {response}")

    return jsonify(response)

# Endpoint to send a plain text message
@app.route('/send-text-message', methods=['POST'])
def send_text_message():
    data = request.get_json()
    phone_number = data.get('phone_number')
    message = data.get('message')

    if not phone_number or not message:
        return jsonify({"error": "Phone number and message text are required"}), 400

    # Validate phone number and handle opt-in logic
    opt_in_status = is_opt_in(phone_number)
    if not opt_in_status["status"]:
        return jsonify({"error": opt_in_status["message"]}), 400

    response = send_whatsapp_text_message(phone_number, message)
    
    if not response["status"]:
        return jsonify({"error": response["error"]}), 400
    # Print response to console
    print(f"Response from WhatsApp API for {phone_number}: {response}")

    return jsonify(response)
# Endpoint to send bulk template messages
@app.route('/send-bulk-messages', methods=['POST'])
def send_bulk_messages():
    data = request.get_json()
    phone_numbers = data.get('phone_numbers')  # List of phone numbers
    template_name = data.get('template_name')

    if not phone_numbers or not isinstance(phone_numbers, list):
        return jsonify({"error": "A list of phone numbers is required"}), 400

    if not template_name:
        return jsonify({"error": "Template name is required"}), 400

    results = []
    for phone_number in phone_numbers:
        # Check the opt-in status and validate the phone number
        opt_in_status = is_opt_in(phone_number)
        
        if not opt_in_status["status"]:
            # If the phone number is not found or not opted-in, return the error message
            results.append({
                "phone_number": phone_number,
                "error": opt_in_status["message"]
            })
        else:
            # If the phone number is opted-in, send the message
            response = send_whatsapp_template_message(phone_number, template_name)
            
            # Check the response status
            if not response["status"]:
                results.append({
                    "phone_number": phone_number,
                    "error": response["error"]
                })
            else:
                results.append({
                    "phone_number": phone_number,
                    "response": response
                })

            # Print response to console
            print(f"Response from WhatsApp API for {phone_number}: {response}")

    return jsonify(results)


#message Using department name
@app.route('/departments', methods=['GET'])
def get_departments():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT DISTINCT department FROM employee_details")
    departments = [row[0] for row in cursor.fetchall()]
    cursor.close()
    connection.close()
    return jsonify(departments)

@app.route('/send-department-message', methods=['POST'])
def send_department_message():
    try:
        data = request.json
        department = data.get('department')
        template_name = data.get('template_name')

        if not department or not template_name:
            error_message = "Missing department or template name"
            print(f"Error: {error_message}")
            return jsonify({"error": error_message}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Fetch employee phone numbers in the department
        cursor.execute("SELECT phone_number FROM employee_details WHERE department = :dept", {"dept": department})
        phone_numbers = [row[0] for row in cursor.fetchall()]

        if not phone_numbers:
            cursor.close()
            connection.close()
            error_message = f"No employees found in the {department} department"
            print(f"Error: {error_message}")
            return jsonify({"error": error_message}), 404

        # Simulate sending messages
        sent_messages = []
        errors = []
        for phone_number in phone_numbers:
            response = send_whatsapp_template_message(phone_number, template_name)

            if not response["status"]:
                errors.append({
                    "phone_number": phone_number,
                    "error": response["error"]
                })
                print(f"Error sending message to {phone_number}: {response['error']}")
            else:
                sent_messages.append({
                    "phone_number": phone_number,
                    "response": response
                })
                print(f"Message sent to {phone_number}: {response}")

        cursor.close()
        connection.close()

        result = {
            "sent_messages": sent_messages,
            "errors": errors,
            "summary": {
                "total": len(phone_numbers),
                "successful": len(sent_messages),
                "failed": len(errors)
            }
        }

        print(f"Successfully processed {len(sent_messages)} messages and encountered {len(errors)} errors for the {department} department.")
        print(f"Encountered error:- {errors}")
        return jsonify(result)

    except Exception as e:
        error_message = f"An unexpected error occurred: {e}"
        print(f"Error: {error_message}")
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)