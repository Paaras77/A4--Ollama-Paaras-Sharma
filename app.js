const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";
const HISTORY_KEY = "ollama-conversation-history";

const modelSelected = document.getElementById("model");
const errorElem = document.getElementById("error");
const historyElem = document.getElementById("history");
const promptInput = document.getElementById("prompt");
const submitButton = document.querySelector('#promptForm button[type="submit"]');

let conversation = loadConversation();

function loadConversation() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not load saved conversation", error);
        return [];
    }
}

function saveConversation() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversation));
}

function renderConversation() {
    historyElem.replaceChildren();
    for (const message of conversation) {
        const entry = document.createElement("article");
        const heading = document.createElement("strong");
        const body = document.createElement("p");
        heading.textContent = message.role === "user" ? "User" : "Assistant (LLM)";
        body.textContent = message.content;
        entry.append(heading, body);
        historyElem.append(entry);
    }
}

async function loadOllamaModels() {
    try {
        const response = await fetch(OLLAMA_TAGS);
        if (!response.ok) throw new Error("Failed to fetch model list");
        const data = await response.json();
        if (data.models?.length) {
            modelSelected.replaceChildren(...data.models.map((model) => {
                const option = document.createElement("option");
                option.value = model.name;
                option.textContent = model.name;
                return option;
            }));
        } else {
            modelSelected.innerHTML = "<option disabled>No model found</option>";
        }
    } catch (error) {
        console.error("Error loading models", error);
        errorElem.textContent = error.message;
        modelSelected.innerHTML = `<option disabled>${error.message}</option>`;
    }
}

async function getOllamaResponse(event) {
    event.preventDefault();
    const userPrompt = promptInput.value.trim();
    if (!userPrompt || !modelSelected.value) return;

    errorElem.textContent = "";
    submitButton.disabled = true;
    conversation.push({ role: "user", content: userPrompt });
    saveConversation();
    renderConversation();
    promptInput.value = "";

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelSelected.value,
                messages: conversation,
                stream: false,
            }),
        });
        if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);
        const data = await response.json();
        conversation.push({ role: "assistant", content: data.message.content });
        saveConversation();
        renderConversation();
    } catch (error) {
        // Keep the user's submitted prompt in history even if Ollama fails.
        errorElem.textContent = `Could not get a response from Ollama: ${error.message}`;
        console.error("Error communicating with Ollama", error);
    } finally {
        submitButton.disabled = false;
    }
}

document.getElementById("promptForm").addEventListener("submit", getOllamaResponse);
function clearConversation() {
    conversation = [];
    saveConversation();
    renderConversation();
    errorElem.textContent = "";
}

document.getElementById("clearConversation").addEventListener("click", clearConversation);

renderConversation();
loadOllamaModels();
