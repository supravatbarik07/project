 
const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL

// Fetch and populate additional templates in the dropdown
async function fetchTemplates() {
    try {
        const response = await fetch(`${backendUrl}/templates`);
        const result = await response.json();

        const templateDropdown = document.getElementById('template_name');
        const bulkTemplateDropdown = document.getElementById('bulk_template_name');
        const bulkExcelTemplateDropdown = document.getElementById('bulk_excel_template_name');
        const departmentEmployeeTemplate = document.getElementById('message_to_department');
        if (result.templates) {
            result.templates.forEach(template => {
                // Skip adding "hello_world" since it's already prepopulated
                if (template !== "hello_world") {
                    const option = document.createElement('option');
                    option.value = template;
                    option.textContent = template;
                    //templateDropdown.appendChild(option);
                    bulkTemplateDropdown.appendChild(option.cloneNode(true));  // Add the same option for bulk
                    bulkExcelTemplateDropdown.appendChild(option.cloneNode(true));
                    departmentEmployeeTemplate.appendChild(option.cloneNode(true));
                }
            });
        } else {
            alert('Failed to fetch templates: Please Verify the Meta Token')
            //console.error('Failed to fetch templates:', result.error);
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
        //alert('Error fetching templates:')
    }
}

// Fetch departments and populate dropdown
async function fetchDepartments() {
    try {
        const response = await fetch(`${backendUrl}/departments`);
        const departments = await response.json();
        const departmentDropdown = document.getElementById('department_dropdown');
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Call this function to fetch templates and departments when the page loads
window.addEventListener('load', fetchTemplates);
window.addEventListener('load', fetchDepartments);


// Function to send a text message
async function sendTextMessage() {
    const phone = document.getElementById('text_phone').value;
    const message = document.getElementById('text_message').value;

    if (!phone || !message) {
        document.getElementById('text_response').innerText = "Please provide a phone number and message text.";
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/send-text-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, message: message })
        });
        const result = await response.json();
        if (result.error) {
            document.getElementById('text_response').innerText = `${result.phone_number} ${result.error}`;
        } else {
            document.getElementById('text_response').innerText = JSON.stringify(result, null, 2);
        }
    } catch (error) {
        document.getElementById('text_response').innerText = "Error sending text message.";
        console.error(error);
    }
}

// // Function to send a template message
// async function sendTemplateMessage() {
//     const phone = document.getElementById('template_phone').value;
//     const templateName = document.getElementById('template_name').value;

//     if (!phone || !templateName) {
//         document.getElementById('template_response').innerText = "Please provide a phone number and select a template.";
//         return;
//     }

//     try {
//         const response = await fetch(`${backendUrl}/send-message`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ phone_number: phone, template_name: templateName })
//         });
//         const result = await response.json();
//         if (result.error) {
//             document.getElementById('template_response').innerText = result.error;
//         } else {
//             document.getElementById('template_response').innerText = JSON.stringify(result, null, 2);
//         }
//     } catch (error) {
//         document.getElementById('template_response').innerText = "Error sending template message.";
//         console.error(error);
//     }
// }


//Bulk messaging
async function sendBulkMessages() {
    const phoneNumbers = document.getElementById('bulk_phone_numbers').value.split(',').map(num => num.trim());
    const templateName = document.getElementById('bulk_template_name').value;

    // Validate inputs
    if (!phoneNumbers[0] || !templateName) {
        document.getElementById('bulk_response').innerText = "Please provide valid phone numbers and select a template.";
        return;
    }

    // Validate phone numbers format
    const isValidPhone = phone => /^[0-9]{10,15}$/.test(phone);
    const invalidNumbers = phoneNumbers.filter(num => !isValidPhone(num));

    if (invalidNumbers.length) {
        document.getElementById('bulk_response').innerText = `Invalid phone numbers: ${invalidNumbers.join(', ')}`;
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
                document.getElementById('bulk_response').innerText += `The ${results.phone_number}  ${results.error}\n`;
                
            //     alert('Invalid phone number or template error!');
            }
            else {
                    document.getElementById('bulk_response').innerText += `Message sent successfully to ${results.phone_number}\n`
                    //JSON.stringify(result, null, 2);
                    // alert('Messages sent successfully!');
                }
        })
    } catch (error) {
         document.getElementById('bulk_response').innerText = "Error sending bulk messages.";
        console.error(error);
    }
}

//Excel messaging 
// Function to send bulk template messages
// Store extracted phone numbers in a variable
let extractedPhoneNumbers = [];

// File input change event listener to process the Excel file
const fileInput = document.getElementById('bulk_file_input');
fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) {
        alert("Please select an Excel file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assuming the phone numbers are in the first sheet and first column
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Extract phone numbers
        extractedPhoneNumbers = rows.map(row => row[0]).filter(num => !!num);

        // Log the numbers for debugging (optional)
        //console.log("Extracted phone numbers:", extractedPhoneNumbers);

        // Feedback to the user
        document.getElementById('excel_response').innerText = "Phone numbers extracted from Excel file.";
    };

    reader.readAsArrayBuffer(file);
});

// Function to send bulk template messages using input excel
async function sendExcelBulkMessages() {
    const templateName = document.getElementById('bulk_excel_template_name').value;

    // Validate inputs
    if (!extractedPhoneNumbers.length || !templateName) {
        document.getElementById('excel_response').innerText = "Please upload an Excel file with valid phone numbers and select a template.";
        return;
    }

    // Validate phone numbers format
    const isValidPhone = phone => /^[0-9]{10,15}$/.test(phone);
    const invalidNumbers = extractedPhoneNumbers.filter(num => !isValidPhone(num));

    if (invalidNumbers.length) {
        document.getElementById('excel_response').innerText = `Invalid phone numbers: ${invalidNumbers.join(', ')}`;
        return;
    }

    try {
        // Provide feedback during processing
        document.getElementById('excel_response').innerText = "Sending messages, please wait...";
        
        const response = await fetch(`${backendUrl}/send-bulk-messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_numbers: extractedPhoneNumbers, template_name: templateName })
        });

        const result = await response.json();
        document.getElementById('excel_response').innerText = '';
        console.log(result);
        result.forEach(results => {
            if (results.hasOwnProperty('error')) {
                document.getElementById('excel_response').innerText += `${results.phone_number} ${results.error}\n`;
            } else {
                document.getElementById('excel_response').innerText += `Message sent successfully to ${results.phone_number}\n`;
            }
        });
    } catch (error) {
        document.getElementById('excel_response').innerText = "Error sending bulk messages.";
        console.error(error);
    }
}
      const clearInputs=document.getElementById('btn')
      clearInputs.addEventListener('click',()=>{
        const clearExcelFile=document.getElementById('bulk_file_input');
        clearExcelFile.value='';
        extractedPhoneNumbers = [];
     })
// Send messages to department employees
async function sendDepartmentMessages() {
    const department = document.getElementById('department_dropdown').value;
    const templateName = document.getElementById('message_to_department').value;

    if (!department || !templateName) {
        alert('Please select a department and provide a template name.');
        return;
    }

    try {
        document.getElementById('department_response').innerText = "Sending messages, please wait...";
        const response = await fetch(`${backendUrl}/send-department-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department, template_name: templateName })
        });

        const result = await response.json();
        console.log(result);
        if (result) {
            document.getElementById('department_response').innerText = `Message Sent to ${department} Department`;
        } else {
            document.getElementById('department_response').innerText = `Message Sending error  to ${department} Department`;
        }
        if(result.errors.length!=0){
            result.errors.forEach(errors_counted=>{
               document.getElementById('department_error_response').innerText = `Error encounted number: ${errors_counted.phone_number} Error_desc: ${errors_counted.error}`;
            })
       }
    } catch (error) {
        document.getElementById('department_response').innerText = `error in sending department message`;
    }
}