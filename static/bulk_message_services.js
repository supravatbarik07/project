import { fetchTemplates,populateDropdown } from './script.js';

window.addEventListener('load', async () => {
    const templates = await fetchTemplates();
    populateDropdown('bulk_template_name', templates);
});

const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL
document.getElementById('send_bulk_messages_button').addEventListener('click', sendBulkMessages);
//Bulk messaging
async function sendBulkMessages() {
    const phoneNumbers = document.getElementById('bulk_phone_numbers').value.split(',').map(num => num.trim());
    const templateName = document.getElementById('bulk_template_name').value;
    document.getElementById('error').innerText ='';
    // Validate inputs
    if (!phoneNumbers[0] || !templateName) {
        document.getElementById('error').innerText = "Please provide valid phone numbers and select a template.";
        return;
    }

    // Validate phone numbers format
    const isValidPhone = phone => /^[0-9]{10,15}$/.test(phone);
    const invalidNumbers = phoneNumbers.filter(num => !isValidPhone(num));

    if (invalidNumbers.length) {
        document.getElementById('error').innerText = `Invalid phone numbers: ${invalidNumbers.join(', ')}`;
        return;
    }

    try {
        // Provide feedback during processing
        document.getElementById('bulk_response').innerText = "Sending messages, please wait...";
        
        const response = await fetch(`${backendUrl}/send-bulk-messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_numbers: phoneNumbers, template_name: templateName })
        });
        document.getElementById('bulk_response').innerText = '';
        const result = await response.json();
        console.log(result)
        result.forEach(results=>{
            if(results.hasOwnProperty('error')){
                document.getElementById('error').innerText += `The ${results.phone_number}  ${results.error}\n`;
                
            //     alert('Invalid phone number or template error!');
            }
            else {
                    document.getElementById('bulk_response').innerText += `Message sent successfully to ${results.phone_number}\n`
                    //JSON.stringify(result, null, 2);
                    // alert('Messages sent successfully!');
                }
        })
    } catch (error) {
         document.getElementById('error').innerText = "Error sending bulk messages.";
        console.error(error);
    }
}