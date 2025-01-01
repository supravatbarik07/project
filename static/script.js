const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL

// Fetch and populate additional templates in the dropdown
export async function fetchTemplates() {
    try {
        const response = await fetch(`${backendUrl}/templates`);
        const result = await response.json();

        if(result.templates){
              return result.templates.filter(template=>template!=='hello_world');
        }
        else{
            console.error('failed to fetch error',result.error);
            alert('Failed to fetch Template please check in console')
            return[];
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
        alert('Error fetching templates:')
        return[]
    }
}

export function populateDropdown(dropdownId, templates) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template;
            option.textContent = template;
            dropdown.appendChild(option);
        });
    } else {
        console.warn(`Dropdown with ID "${dropdownId}" not found.`);
    }
}
// Fetch departments and populate dropdown
export async function fetchDepartments() {
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

export async function addAnimation(){
    document.querySelector('.loader').style.display = 'block';
    document.querySelector('.loader-container').classList.remove('invisible');
    document.querySelector('.loader-container').classList.add('visible');
    document.getElementById("blur-bg").classList.add("visible");
}
export async function removeAnimation(){
    document.querySelector('.loader').style.display = 'block';
    document.querySelector('.loader-container').classList.add('invisible');
    document.querySelector('.loader-container').classList.remove('visible');
    document.getElementById("blur-bg").classList.remove("visible");
}

// Call this function to fetch templates and departments when the page loads
// window.addEventListener('load', fetchTemplates);
// window.addEventListener('load', fetchDepartments);

