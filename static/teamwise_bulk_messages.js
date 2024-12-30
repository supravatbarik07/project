import { fetchTemplates, fetchDepartments, populateDropdown } from './script.js';

window.addEventListener('load', async () => {
    try {
        // Fetch and populate templates
        const templates = await fetchTemplates();
        populateDropdown('message_to_department', templates);

        // Fetch and populate departments
        await fetchDepartments();
    } catch (error) {
        console.error('Error during page load:', error);
    }
});
const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL

document.getElementById('sendDepartmentMessages').addEventListener('click',sendDepartmentMessages)
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