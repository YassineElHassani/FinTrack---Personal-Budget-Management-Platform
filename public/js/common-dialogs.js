function showMessage(message, type = 'info', duration = 5000) {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.error('Message container not found in the document');
        return;
    }
    
    const messageId = 'msg_' + Date.now();

    const messageHtml = `
        <div id="${messageId}" class="message message-${type}">
            ${message}
            <button class="message-close" onclick="hideMessage('${messageId}')">&times;</button>
        </div>
    `;

    container.innerHTML = messageHtml;
    container.style.display = 'block';

    if (duration > 0) {
        setTimeout(() => {
            hideMessage(messageId);
        }, duration);
    }
}

function showConfirmMessage(message, onConfirm, onCancel = null) {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.error('Message container not found in the document');
        return;
    }
    
    const messageId = 'confirm_' + Date.now();

    const messageHtml = `
        <div id="${messageId}" class="message message-warning">
            ${message}
            <div class="confirm-actions">
                <button class="btn-primary" onclick="handleConfirm('${messageId}', true)">Confirm</button>
                <button class="btn-secondary" onclick="handleConfirm('${messageId}', false)">Cancel</button>
            </div>
        </div>
    `;

    container.innerHTML = messageHtml;
    container.style.display = 'block';

    window.confirmCallbacks = window.confirmCallbacks || {};
    window.confirmCallbacks[messageId] = { onConfirm, onCancel };
}

function hideMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.style.animation = 'messageSlideUp 0.3s ease';
        setTimeout(() => {
            const container = document.getElementById('messageContainer');
            if (container) {
                if (message.parentNode === container) {
                    container.removeChild(message);
                }
                if (container.children.length === 0) {
                    container.style.display = 'none';
                }
            }
        }, 300);
    }
}

function handleConfirm(messageId, result) {
    const callbacks = window.confirmCallbacks && window.confirmCallbacks[messageId];
    if (callbacks) {
        if (result && callbacks.onConfirm) {
            callbacks.onConfirm();
        } else if (!result && callbacks.onCancel) {
            callbacks.onCancel();
        }
        delete window.confirmCallbacks[messageId];
    }
    hideMessage(messageId);
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer && messageContainer.style.display !== 'none') {
            messageContainer.style.display = 'none';
            messageContainer.innerHTML = '';
        }
    }
});