import { fetchTemplates,populateDropdown,addAnimation,removeAnimation} from './script.js';
import { backendUrl } from './config.js';
window.addEventListener('load', async () => {
    try {
        // Fetch and populate templates
        const templates = await fetchTemplates();
        populateDropdown('message_to_department', templates);

        // Fetch and populate departments
    } catch (error) {
        console.error('Error during page load:', error);
    }
});

// Array to keep track of selected employees
let selectedEmployeeIds = [];

// Send message to employee when input is changed
async function sendMessageToEmployee() {
    const empInput = document.getElementById('empName').value.trim();
    const employeeDropdown = document.getElementById('employeeDropdown');
    const responseElement = document.getElementById('response');
    const selectedEmployees = document.getElementById('selectedEmployees');

    // Clear previous messages and dropdown
    responseElement.innerText = '';
    employeeDropdown.innerHTML = ''; // Clear existing dropdown items
    employeeDropdown.style.display = 'none';

    if (!empInput) {
        responseElement.innerText = 'Please enter a name or ID to search';
        return;
    }

    // Determine if input is an ID (numeric) or a name (non-numeric)
    const isId = /^\d+$/.test(empInput);

    try {
        // Fetch data from the backend
        const response = await fetch(`${backendUrl}/employeename`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isId ? { employee_id: empInput } : { employee: empInput }) // Send appropriate data
        });

        const result = await response.json();
        
        // Clear dropdown before processing new data
        employeeDropdown.innerHTML = '';

        // Handle response
        if (result[0]?.error) {
            // Display error message in the dropdown
            employeeDropdown.innerHTML = `<li>${result[0].error}</li>`;
            employeeDropdown.style.display = 'block';
        } else if (Array.isArray(result) && result.length > 0) {
            // Populate dropdown with employee data, ensuring not to show already selected employees
            let foundAlreadySelected = false;

            result.forEach(employee => {
                // Skip if employee is already selected
                if (!selectedEmployeeIds.includes(employee.employee_id)) {
                    const li = document.createElement('li');
                    li.textContent = `${employee.name} (ID: ${employee.employee_id}) Dept: ${employee.department}`;
                    li.addEventListener('click', () => {
                        // Create a block for the selected employee
                        const employeeBlock = document.createElement('div');
                        employeeBlock.classList.add('selected-employee');
                        employeeBlock.innerHTML = `
                            <span>${employee.name}, ${employee.employee_id}, ${employee.department}</span>
                            <button class="close-btn">X</button>
                        `;
                        // Add to the selected employees container
                        selectedEmployees.appendChild(employeeBlock);

                        // Add to selectedEmployeeIds array
                        selectedEmployeeIds.push(employee.employee_id);

                        // Add close button functionality
                        const closeButton = employeeBlock.querySelector('.close-btn');
                        closeButton.addEventListener('click', () => {
                            // Remove from selected list and re-add to dropdown
                            selectedEmployees.removeChild(employeeBlock);
                            selectedEmployeeIds = selectedEmployeeIds.filter(id => id !== employee.employee_id);

                            // Re-show the employee in the dropdown
                            const li = document.createElement('li');
                            li.textContent = `${employee.name} (ID: ${employee.employee_id}) Dept: ${employee.department}`;
                            li.addEventListener('click', () => {
                                // Similar logic as before for adding to selected employees
                                const employeeBlock = document.createElement('div');
                                employeeBlock.classList.add('selected-employee');
                                employeeBlock.innerHTML = `
                                    <span>${employee.name}, ${employee.employee_id}, ${employee.department}</span>
                                    <button class="close-btn">X</button>
                                `;
                                selectedEmployees.appendChild(employeeBlock);
                                selectedEmployeeIds.push(employee.employee_id);

                                const closeButton = employeeBlock.querySelector('.close-btn');
                                closeButton.addEventListener('click', () => {
                                    selectedEmployees.removeChild(employeeBlock);
                                    selectedEmployeeIds = selectedEmployeeIds.filter(id => id !== employee.employee_id);
                                });

                                employeeDropdown.style.display = 'none';  // Hide dropdown after selection
                            });

                            employeeDropdown.appendChild(li);
                        });

                        employeeDropdown.style.display = 'none';  // Hide dropdown after selection
                    });
                    employeeDropdown.appendChild(li);
                } else {
                    foundAlreadySelected = true;
                }
            });

            // If any employee was already selected, show a message
            if (foundAlreadySelected) {
                const messageLi = document.createElement('li');
                result.forEach(employee=>{
                messageLi.textContent = `${employee.name} (${employee.employee_id})are already selected`;
                messageLi.style.color = 'black'; // Style the message (optional)
                })
                
                employeeDropdown.appendChild(messageLi);

            }

            employeeDropdown.style.display = 'block';
        } else {
            responseElement.innerText = 'No matching records found';
        }
    } catch (error) {
        // Handle fetch or other errors
        responseElement.innerText = 'An error occurred while fetching employee data';
        console.error('Error:', error);
    }
}

// Debounce function to prevent rapid firing of the input event
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// Add debounced input event listener to the input field
document.getElementById('empName').addEventListener('input', debounce(sendMessageToEmployee, 300));

document.getElementById('sendMessage').addEventListener('click', sendMessages);

// Send messages to department employees
async function sendMessages() {
    const templateName = document.getElementById('message_to_department').value;
    const selectedEmployeesContainer = document.getElementById('selectedEmployees');
    const selectedEmployees = selectedEmployeesContainer.getElementsByClassName('selected-employee'); // Get all selected employee blocks
    const responseElement = document.getElementById('response');

    responseElement.innerText = ''; // Clear previous messages

    // Check if any employee is selected
    if (selectedEmployees.length === 0 || !templateName) {
        responseElement.innerText = 'Please select at least one employee and provide a template name.';
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Iterate over all selected employees and send message to each one
    for (const employeeBlock of selectedEmployees) {
        const employeeDetails = employeeBlock.querySelector('span').textContent.split(', ');
        const name = employeeDetails[0];
        const id = employeeDetails[1];
        const department = employeeDetails[2];

        try {
            addAnimation();
            responseElement.innerText = "Sending messages, please wait..."; // Display loading message
            const response = await fetch(`${backendUrl}/send-employee-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department,
                    template_name: templateName,
                    employee: name,
                    employee_id: id
                })
            });

            const result = await response.json();
            if (result.error) {
                responseElement.innerText += ` Error sending message to ${name}: ${result.error}`;
                errorCount++;
            } else {
                successCount++;
            }
        } catch (error) {
            console.error(error);
            responseElement.innerText += ` Error sending message to ${name}.`;
            errorCount++;
        }
        finally{
            removeAnimation();
        }
    }

    // Show success and error counts
    if (successCount > 0) {
        responseElement.innerText = "";
        responseElement.innerText += ` Successfully sent messages to ${successCount} employee(s).`;
    }

    if (errorCount > 0) {
        responseElement.innerText = "";
        responseElement.innerText += ` Error sending messages to ${errorCount} employee(s).`;
    }
}
