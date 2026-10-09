const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";

const modelSelected = document.getElementById("model");
const errorElem = document.getElementById("error");
const answer = document.getElementById("answer");
//load the AI models

async function loadOllamaMOdels(){
    try{

        const response = await fetch(OLLAMA_TAGS);
        // check the req
        if(!response.ok){
            errorElem.innerHTML = "Failed to fetch model list";
            throw new Error("Failed to fetch model list");
        }
        const data = await response.json();
        // if at lease one model exist
        if(data.models && data.models.length>0){
            // make a loop - map - to every model and create something new
            const optionsHtml = data.models.map((model)=>
                `<option value="${model.name}">${model.name}</option>`

            ).join("");
            // put the model into the dropdown
            modelSelected.innerHTML = optionsHtml;
        }
        else{
            modelSelected.innerHTML = "<option disabled>No model found</option>"
        }

    }
    catch(err){
    // if ther model does not exist show me an err
    console.error("Error loading models", err);
    errorElem.innerHTML = err.message;
    modelSelected.innerHTML = `<option disabled>${err.message}</option>`
    }
}
loadOllamaMOdels();

// PART 2 : send a prompt to AI

async function getOllamaResponse(event){
    event.preventDefault();
    // get the user prompt
    const serPropmt = document.getElementById("prompt").value
    const payload = {
        model : modelSelected.value,
        prompt : serPropmt,
        stream : false
    }

    try{


        const response = await fetch(OLLAMA_API_URL , {
            method : "POST",
            headers: {"Content-Type": "application/json"},
            body : JSON.stringify(payload),
        });
        if(!response.ok){
            throw new Error ( `Error:${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        console.log(modelSelected.value + "OUTPUT", data );

        answer.innerHTML = `<p>${modelSelected.value} output:</p>${data.response}`

    }
    catch(error){
        console.error("ERROR communication with Ollama", error);

    }
}

document.getElementById("promptForm").addEventListener("submit",getOllamaResponse)