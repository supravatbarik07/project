import { addAnimation,removeAnimation } from './script.js';
import { backendUrl } from './config.js';

// const backendUrl = 'http://127.0.0.1:5500';  // Replace with your backend URL

//update meta Token, Phone_number_id, whatsapp_number_id
const meta_update_token=document.getElementById('meta_details');
async function updateMetaDetails() {
    const meta_token_input=document.getElementById('meta_token_input').value.trim();
    const phone_number_id=document.getElementById('phone_number_id').value.trim();
    const whatsApp_business_Account_id=document.getElementById('whatsApp_business_Account_id').value.trim();
    addAnimation()
    try{
        const response=await fetch(`${backendUrl}/update-config`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: meta_token_input || null, 
                phone_number_id: phone_number_id || null, 
                whatsApp_business_account_id: whatsApp_business_Account_id || null})
        })
    
        const result= await response.json();
        if(response.ok){
            alert('Recored updeted successfully')
        }else{
            // alert('somthing error'+result)
            document.getElementById('error').innerText=`${result.error}`
        }
    }
catch(error){
     console.log(error);  
}
finally{
    removeAnimation()
}
}
meta_update_token.addEventListener('click',updateMetaDetails);
