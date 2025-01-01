import { fetchTemplates,populateDropdown,addAnimation,removeAnimation } from './script.js';

window.addEventListener('load', async () => {
    const templates = await fetchTemplates();
    populateDropdown('bulk_excel_template_name', templates);
});

const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL

//Excel messaging 
// Function to send bulk template messages
// Store extracted phone numbers in a variable
let extractedPhoneNumbers = [];

// File input change event listener to process the Excel file
const fileInput = document.getElementById('bulk_file_input');
fileInput.addEventListener('change', () => {
    document.getElementById('error').innerText=``;
    if (!fileInput.files.length) {
        removeAnimation()
        document.getElementById('error').innerText=`Please select an Excel file`;
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

document.getElementById('sendExcelBulkMessages').addEventListener('click',sendExcelBulkMessages)
// Function to send bulk template messages using input excel
async function sendExcelBulkMessages() {
    const templateName = document.getElementById('bulk_excel_template_name').value;
    document.getElementById('error').innerText=``;
    // Validate inputs
    if (!extractedPhoneNumbers.length || !templateName) {
        removeAnimation();
        document.getElementById('error').innerText = "Please upload an Excel file with valid phone numbers and select a template.";
        return;
    }

    // Validate phone numbers format
    const isValidPhone = phone => /^[0-9]{10,15}$/.test(phone);
    const invalidNumbers = extractedPhoneNumbers.filter(num => !isValidPhone(num));

    if (invalidNumbers.length) {
        removeAnimation()
        document.getElementById('error').innerText = `Invalid phone numbers: ${invalidNumbers.join(', ')}`;
        return;
    }
      addAnimation();
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
                document.getElementById('error').innerText += `${results.phone_number} ${results.error}\n`;
            } else {
                document.getElementById('excel_response').innerText += `Message sent successfully to ${results.phone_number}\n`;
            }
        });
    } catch (error) {
        document.getElementById('error').innerText = "Error sending bulk messages.";
        console.error(error);
    }
    finally{
        removeAnimation();
    }
}
      const clearInputs=document.getElementById('btn')
      clearInputs.addEventListener('click',()=>{
        const clearExcelFile=document.getElementById('bulk_file_input');
        clearExcelFile.value='';
        extractedPhoneNumbers = [];
     })