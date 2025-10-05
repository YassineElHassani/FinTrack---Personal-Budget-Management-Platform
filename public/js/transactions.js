function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('submitBtn').textContent = 'Add Transaction';
    document.getElementById('transactionForm').action = '/dashboard/transactions';
    document.getElementById('transactionForm').removeAttribute('data-method');
    document.getElementById('transactionId').value = '';
    document.getElementById('type').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category_id').value = '';
    document.getElementById('transaction_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('description').value = '';
    document.getElementById('transactionModal').style.display = 'block';
}

function editTransaction(transactionId) {
    fetch(`/api/transactions/${transactionId}`)
        .then(response => response.json())
        .then(transaction => {
            document.getElementById('modalTitle').textContent = 'Edit Transaction';
            document.getElementById('submitBtn').textContent = 'Update Transaction';
            document.getElementById('transactionForm').action = `/dashboard/transactions/${transactionId}`;
            document.getElementById('transactionForm').setAttribute('data-method', 'PUT');
            document.getElementById('transactionId').value = transaction.id;
            document.getElementById('type').value = transaction.type;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category_id').value = transaction.category_id || '';
            document.getElementById('transaction_date').value = transaction.transaction_date;
            document.getElementById('description').value = transaction.description || '';
            document.getElementById('transactionModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching transaction:', error);
            showMessage('Error loading transaction details', 'error');
        });
}

function deleteTransaction(transactionId) {
    showConfirmMessage('Are you sure you want to delete this transaction?', function() {
        fetch(`/dashboard/transactions/${transactionId}`, {
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
            showMessage('Error deleting transaction', 'error');
        });
    });
}

function exportTransactions() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const type = document.getElementById('typeFilter').value;
    
    let url = '/dashboard/transactions/export?';
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (type) params.append('type', type);
    
    window.location.href = url + params.toString();
}

function filterTransactions() {
    const typeFilter = document.getElementById('typeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const table = document.getElementById('transactionsTable');
    if (!table) return;

    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let row of rows) {
        let show = true;

        if (typeFilter && row.getAttribute('data-type') !== typeFilter) {
            show = false;
        }

        if (categoryFilter && row.getAttribute('data-category') !== categoryFilter) {
            show = false;
        }

        const rowDate = row.getAttribute('data-date');
        if (startDate && rowDate < startDate) {
            show = false;
        }
        if (endDate && rowDate > endDate) {
            show = false;
        }

        row.style.display = show ? '' : 'none';
    }
}

function updateFormForType() {}

function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
}

document.getElementById('transactionForm').addEventListener('submit', function(e) {
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
            alert('Error updating transaction');
        });
    }
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('transactionModal');
    if (e.target === modal) {
        closeModal();
    }
});