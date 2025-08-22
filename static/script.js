// static/script.js
document.addEventListener("DOMContentLoaded", () => {
    // --- Element Selectors ---
    const appContainer = document.getElementById("app-container");
    const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
    const newChatButton = document.getElementById("new-chat-btn");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.getElementById("chat-box");
    const historyList = document.getElementById("chat-history-list");

    // --- State Management ---
    let allChats = {};
    let activeChatId = null;

    // --- Core Functions ---
    function init() {
        loadChatsFromStorage();
        const lastActiveId = localStorage.getItem('activeChatId');
        if (lastActiveId && allChats[lastActiveId]) {
            loadChat(lastActiveId);
        } else {
            startNewChat();
        }
    }

    function startNewChat() {
        const newChatId = `chat_${Date.now()}`;
        allChats[newChatId] = {
            title: "New Chat",
            messages: [{
                role: "Assistant",
                displayContent: "<p>Hello! How can I help you with the database today?</p>",
                historyContent: "Hello! How can I help you with the database today?"
            }]
        };
        setActiveChat(newChatId);
    }
    
    function deleteChat(chatId) {
        if (!allChats[chatId]) return;
        
        if (confirm(`Are you sure you want to delete "${allChats[chatId].title}"?`)) {
            delete allChats[chatId];
            saveChatsToStorage();

            if (activeChatId === chatId) {
                const remainingChatIds = Object.keys(allChats).sort().reverse();
                if (remainingChatIds.length > 0) {
                    loadChat(remainingChatIds[0]);
                } else {
                    startNewChat();
                }
            } else {
                renderSidebar();
            }
        }
    }

    function loadChat(chatId) {
        setActiveChat(chatId);
    }

    function setActiveChat(chatId) {
        activeChatId = chatId;
        localStorage.setItem('activeChatId', chatId);
        renderChatBox();
        renderSidebar();
    }

    // --- UI Rendering ---
    function renderSidebar() {
        historyList.innerHTML = "";
        Object.keys(allChats).sort().reverse().forEach(chatId => {
            const chat = allChats[chatId];
            const li = document.createElement("li");
            li.className = "history-item";
            li.dataset.chatId = chatId;
            
            const titleSpan = document.createElement("span");
            titleSpan.className = "history-item-title";
            titleSpan.textContent = chat.title;
            li.appendChild(titleSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-chat-btn";
            deleteBtn.title = "Delete Chat";
            // --- FIX: Using a three-dots SVG icon ---
            deleteBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>`;
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteChat(chatId);
            });
            li.appendChild(deleteBtn);
            
            if (chatId === activeChatId) { li.classList.add("active"); }
            li.addEventListener("click", () => loadChat(chatId));
            historyList.appendChild(li);
        });
    }

    function renderChatBox() {
        chatBox.innerHTML = "";
        if (activeChatId && allChats[activeChatId]) {
            allChats[activeChatId].messages.forEach(message => {
                addMessage(message.displayContent, message.role.toLowerCase());
            });
        }
    }
    
    // --- Data & API ---
    async function sendMessage() {
        if (!userInput) return;
        const question = userInput.value.trim();
        if (!question || !activeChatId) return;

        const userMessage = { 
            role: "User", 
            displayContent: `<p>${question}</p>`,
            historyContent: question 
        };
        allChats[activeChatId].messages.push(userMessage);
        addMessage(userMessage.displayContent, "user");
        userInput.value = "";
        
        const loadingMessage = addLoadingMessage();
        
        const isFirstUserMessage = allChats[activeChatId].messages.filter(m => m.role === 'User').length === 1;

        const historyForApi = allChats[activeChatId].messages.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.historyContent
        }));

        try {
            const response = await fetch("/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, history: historyForApi }),
            });
            
            chatBox.removeChild(loadingMessage);
            if (!response.ok) throw new Error("Server error");
            const data = await response.json();
            
            const { displayContent, historyContent } = generateBotResponse(data);
            const botMessage = { role: "Assistant", displayContent, historyContent };
            allChats[activeChatId].messages.push(botMessage);
            
            addMessage(botMessage.displayContent, "assistant");
            saveChatsToStorage();
            
            if (isFirstUserMessage && !data.error && !data.is_clarification) {
                generateAndSetChatTitle(activeChatId);
            }

        } catch (error) {
            chatBox.removeChild(loadingMessage);
            const errorMessage = "I'm having some trouble connecting right now. Please try again in a moment.";
            addMessage(`<p>${errorMessage}</p>`, "assistant");
        }
    }

    async function generateAndSetChatTitle(chatId) {
        const historyForTitle = allChats[chatId].messages.map(msg => ({
            role: msg.role,
            content: msg.historyContent
        }));

        try {
            const response = await fetch("/generate-title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ history: historyForTitle }),
            });
            if (!response.ok) return;
            const data = await response.json();
            allChats[chatId].title = data.title;
            saveChatsToStorage();
            renderSidebar();
        } catch (error) {
            console.error("Failed to generate title:", error);
        }
    }
    
    // --- Local Storage & Helpers ---
    function saveChatsToStorage() {
        localStorage.setItem('allChats', JSON.stringify(allChats));
    }

    function loadChatsFromStorage() {
        allChats = JSON.parse(localStorage.getItem('allChats')) || {};
    }

    function addMessage(html, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = html;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addLoadingMessage() {
       const messageDiv = document.createElement("div");
        messageDiv.className = "message bot-message loading-dots";
        messageDiv.innerHTML = `<span></span><span></span><span></span>`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageDiv;
    }

    function generateBotResponse(data) {
        let displayContent = "";
        let historyContent = "";

        if (data.is_greeting || data.is_refusal || data.is_clarification) {
            displayContent = `<p>${data.summary}</p>`;
            historyContent = data.summary;
        } else if (data.error) {
            displayContent = `<p>I encountered an issue: ${data.error}</p>`;
            historyContent = `Error: ${data.error}`;
        } else {
            displayContent += `<p>${data.summary}</p>`;
            displayContent += `<details><summary>Click to see the generated SQL query</summary><pre><code>${data.sql_query}</code></pre></details>`;
            const results = JSON.parse(data.results_json);
            if (results.length > 0) {
                displayContent += '<div class="table-container"><table><thead><tr>';
                Object.keys(results[0]).forEach(key => displayContent += `<th>${key}</th>`);
                displayContent += "</tr></thead><tbody>";
                results.forEach(row => {
                    displayContent += "<tr>";
                    Object.values(row).forEach(val => displayContent += `<td>${val}</td>`);
                    displayContent += "</tr>";
                });
                displayContent += "</tbody></table></div>";
            }
            historyContent = `${data.summary}\nSQL Query: ${data.sql_query}`;
        }
        return { displayContent, historyContent };
    }

    // --- Event Listeners ---
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener("click", () => {
            appContainer.classList.toggle("sidebar-collapsed");
        });
    }
    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            const currentChat = allChats[activeChatId];
            if (currentChat && currentChat.messages.length > 1) {
                startNewChat();
            }
        });
    }
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }
    if (userInput) {
        userInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // --- Start the application ---
    init();
});