function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Savings Goal';
    document.getElementById('submitBtn').textContent = 'Create Goal';
    document.getElementById('savingForm').action = '/dashboard/saving';
    document.getElementById('savingForm').removeAttribute('data-method');
    document.getElementById('savingId').value = '';
    document.getElementById('goal_name').value = '';
    document.getElementById('goal_amount').value = '';
    document.getElementById('saved_amount').value = '';
    document.getElementById('target_date').value = '';
    document.getElementById('savingModal').style.display = 'block';
}

function editSaving(savingId) {
    fetch(`/api/saving/${savingId}`)
        .then(response => response.json())
        .then(saving => {
            document.getElementById('modalTitle').textContent = 'Edit Savings Goal';
            document.getElementById('submitBtn').textContent = 'Update Goal';
            document.getElementById('savingForm').action = `/dashboard/saving/${savingId}`;
            document.getElementById('savingForm').setAttribute('data-method', 'PUT');
            document.getElementById('savingId').value = saving.id;
            document.getElementById('goal_name').value = saving.goal_name;
            document.getElementById('goal_amount').value = saving.goal_amount;
            document.getElementById('saved_amount').value = saving.saved_amount;
            document.getElementById('target_date').value = saving.target_date ? saving.target_date.split('T')[0] : '';
            document.getElementById('savingModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching saving:', error);
            showMessage('Error loading saving details', 'error');
        });
}

function deleteSaving(savingId) {
    showConfirmMessage('Are you sure you want to delete this savings goal? This action cannot be undone.', function() {
        fetch(`/dashboard/saving/${savingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error deleting savings goal', 'error');
        });
    });
}

function openAddMoneyModal(savingId, goalName) {
    document.getElementById('addMoneyTitle').textContent = `Add Money to ${goalName}`;
    document.getElementById('addMoneyForm').action = `/dashboard/saving/${savingId}/add`;
    document.getElementById('add_amount').value = '';
    document.getElementById('addMoneyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('savingModal').style.display = 'none';
}

function closeAddMoneyModal() {
    document.getElementById('addMoneyModal').style.display = 'none';
}

document.getElementById('savingForm').addEventListener('submit', function(e) {
    const method = this.getAttribute('data-method');
    if (method === 'PUT') {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        fetch(this.action, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error updating savings goal', 'error');
        });
    }
});

window.addEventListener('click', function(e) {
    const savingModal = document.getElementById('savingModal');
    const addMoneyModal = document.getElementById('addMoneyModal');

    if (e.target === savingModal) {
        closeModal();
    }
    if (e.target === addMoneyModal) {
        closeAddMoneyModal();
    }
});