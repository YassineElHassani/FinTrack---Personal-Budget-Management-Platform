function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Budget';
    document.getElementById('submitBtn').textContent = 'Create Budget';
    document.getElementById('budgetForm').action = '/dashboard/budget';
    document.getElementById('budgetForm').removeAttribute('data-method');
    document.getElementById('budgetId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('total_amount').value = '';
    document.getElementById('month_year').value = new Date().toISOString().slice(0, 7);
    document.getElementById('budgetModal').style.display = 'block';
}

function editBudget(budgetId) {
    fetch(`/api/budget/${budgetId}`)
        .then(response => response.json())
        .then(budget => {
            document.getElementById('modalTitle').textContent = 'Edit Budget';
            document.getElementById('submitBtn').textContent = 'Update Budget';
            document.getElementById('budgetForm').action = `/dashboard/budget/${budgetId}`;
            document.getElementById('budgetForm').setAttribute('data-method', 'PUT');
            document.getElementById('budgetId').value = budget.id;
            document.getElementById('name').value = budget.name;
            document.getElementById('total_amount').value = budget.total_amount;
            document.getElementById('month_year').value = budget.month_year || '';
            document.getElementById('budgetModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching budget:', error);
            showMessage('Error loading budget details', 'error');
        });
}

function deleteBudget(budgetId) {
    showConfirmMessage('Are you sure you want to delete this budget?', function() {
        fetch(`/dashboard/budget/${budgetId}`, {
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
                showMessage('Error deleting budget', 'error');
            });
    });
}

function closeModal() {
    document.getElementById('budgetModal').style.display = 'none';
}

document.getElementById('budgetForm').addEventListener('submit', function (e) {
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
                alert('Error updating budget');
            });
    }
});

window.addEventListener('click', function (e) {
    const modal = document.getElementById('budgetModal');
    if (e.target === modal) {
        closeModal();
    }
});