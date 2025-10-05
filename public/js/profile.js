function showMessage(message, type = 'info', duration = 5000) {
    const container = document.getElementById('messageContainer');
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
            container.removeChild(message);
            if (container.children.length === 0) {
                container.style.display = 'none';
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

function openPersonalInfoModal() {
    document.getElementById('personalInfoModal').style.display = 'flex';
    document.getElementById('modal_username').focus();
}

function closePersonalInfoModal() {
    document.getElementById('personalInfoModal').style.display = 'none';
    document.getElementById('personalInfoForm').reset();
}

function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('modal_new_password').focus();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordForm').reset();
}

document.getElementById('personalInfoModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closePersonalInfoModal();
    }
});

document.getElementById('passwordModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closePasswordModal();
    }
});

function exportData() {
    showConfirmMessage(
        'This will export all your financial data to a CSV file. Do you want to continue?',
        function () {
            showMessage('Preparing your data export...', 'info', 2000);
            setTimeout(() => {
                window.location.href = '/dashboard/profile/export';
            }, 1000);
        }
    );
}

function confirmDeleteAccount() {
    showConfirmMessage(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
        function () {
            showConfirmMessage(
                'FINAL WARNING: All your financial data, budgets, transactions, and savings will be permanently deleted. Are you absolutely sure?',
                function () {
                    showMessage('Deleting your account...', 'error', 2000);
                    setTimeout(() => {
                        window.location.href = '/dashboard/profile/delete-account';
                    }, 1500);
                }
            );
        }
    );
}

document.getElementById('personalInfoForm').addEventListener('submit', function (e) {
    const username = document.getElementById('modal_username').value.trim();
    const email = document.getElementById('modal_email').value.trim();

    if (!username || !email) {
        e.preventDefault();
        closePersonalInfoModal();
        showMessage('Please fill in all required fields.', 'error');
        return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
        e.preventDefault();
        closePersonalInfoModal();
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }
});

document.getElementById('passwordForm').addEventListener('submit', function (e) {
    const newPassword = document.getElementById('modal_new_password').value;
    const confirmPassword = document.getElementById('modal_confirm_password').value;

    if (newPassword !== confirmPassword) {
        e.preventDefault();
        closePasswordModal();
        showMessage('Passwords do not match. Please try again.', 'error');
        return false;
    }

    if (newPassword.length < 8) {
        e.preventDefault();
        closePasswordModal();
        showMessage('Password must be at least 8 characters long.', 'error');
        return false;
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (document.getElementById('personalInfoModal').style.display === 'flex') {
            closePersonalInfoModal();
        }
        if (document.getElementById('passwordModal').style.display === 'flex') {
            closePasswordModal();
        }

        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer && messageContainer.style.display !== 'none') {
            messageContainer.style.display = 'none';
            messageContainer.innerHTML = '';
        }
    }
});