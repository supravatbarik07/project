import { fetchTemplates, fetchDepartments, populateDropdown,addAnimation,removeAnimation} from './script.js';
import { backendUrl } from './config.js';
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
    
    async function sendMessageToEmployee() {
        const empName=document.getElementById('empName').value;
        const employeeDropdown=document.getElementById('employeeDropdown');
        if(!empName.trim()){
            document.getElementById('response').innerText='please enter a name to search';
            employeeDropdown.style.display='';
            return;
        }
        try{
            const response=await fetch(`${backendUrl}/employeename`,{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({employee:empName})
            })
            
            const result=await response.json();
            employeeDropdown.innerHTML=''
            //console.log(result)
            if(result[0]?.error){
                employeeDropdown.innerHTML=`<li>${result[0].error}</li>`;
                employeeDropdown.style.display = 'block';
            }
            else{
                result.forEach(employee=>{
                    const li=document.createElement('li');
                    li.textContent=`${employee.name} id: ${employee.employee_id}`
                    li.addEventListener('click',()=>{
                        document.getElementById('empName').value=`${employee.name}`
                        employeeDropdown.style.display = 'none';
                    })
                    employeeDropdown.append(li);
                });
                employeeDropdown.style.display = 'block';
                document.getElementById('response').innerText='';
            }
        }
        catch(error){
            document.getElementById('response').innerText = "somthing error";
        // console.error(error);
        }
    }
    // async function sendMsgToName() {
        
    // }
    document.getElementById('empName').addEventListener('input',sendMessageToEmployee)
    document.getElementById('sendMessage').addEventListener('click',sendMessages)
    // Send messages to department employees
    async function sendMessages() {
        const department = document.getElementById('department_dropdown').value;
        const templateName = document.getElementById('message_to_department').value;
        const empName=document.getElementById('empName').value;
        document.getElementById('response').innerText=''
        if (!department || !templateName || !empName) {
            removeAnimation();
            document.getElementById('response').innerText='Please select a department and provide a template name.'
            return;
        }
         addAnimation()
        try {
            document.getElementById('response').innerText = "Sending messages, please wait...";
            const response = await fetch(`${backendUrl}/send-employee-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department, template_name: templateName,employee: empName })
            });
    
            const result = await response.json();
            console.log(result);
            if (result) {
                document.getElementById('response').innerText = `Message Sent to ${department} Department `;
            } else {
                document.getElementById('response').innerText = `Message Sending error  to ${department} Department`;
            }
            if(result.errors.length!=0){
                result.errors.forEach(errors_counted=>{
                   document.getElementById('response').innerText = `Error encounted number: ${errors_counted.phone_number} Error_desc: ${errors_counted.error}`;
                })
           }
        } catch (error) {
            document.getElementById('response').innerText = `${result.error}`;
        }
        finally{
            removeAnimation();
        }
    }