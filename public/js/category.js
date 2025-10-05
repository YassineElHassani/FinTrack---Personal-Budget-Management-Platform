function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Category';
    document.getElementById('submitBtn').textContent = 'Create Category';
    document.getElementById('categoryForm').action = '/dashboard/category';
    document.getElementById('categoryForm').removeAttribute('data-method');
    document.getElementById('categoryId').value = '';
    document.getElementById('category_name').value = '';
    document.getElementById('categoryModal').style.display = 'block';
}

function editCategory(categoryId) {
    fetch(`/api/category/${categoryId}`)
        .then(response => response.json())
        .then(category => {
            document.getElementById('modalTitle').textContent = 'Edit Category';
            document.getElementById('submitBtn').textContent = 'Update Category';
            document.getElementById('categoryForm').action = `/dashboard/category/${categoryId}`;
            document.getElementById('categoryForm').setAttribute('data-method', 'PUT');
            document.getElementById('categoryId').value = category.id;
            document.getElementById('category_name').value = category.category_name;
            document.getElementById('categoryModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching category:', error);
            showMessage('Error loading category details', 'error');
        });
}

function deleteCategory(categoryId) {
    showConfirmMessage('Are you sure you want to delete this category? This action cannot be undone.', function() {
        fetch(`/dashboard/category/${categoryId}`, {
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
            showMessage('Error deleting category', 'error');
        });
    });
}

function viewCategoryDetails(categoryId) {
    fetch(`/api/category/${categoryId}`)
        .then(response => response.json())
        .then(category => {
            document.getElementById('detailsTitle').textContent = `${category.category_name} - Transactions`;

            let html = '<div class="transactions-list">';
            if (category.Transactions && category.Transactions.length > 0) {
                html += '<table class="details-table">';
                html += '<thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>';
                html += '<tbody>';

                category.Transactions.forEach(transaction => {
                    html += `<tr>
                        <td>${new Date(transaction.transaction_date).toLocaleDateString()}</td>
                        <td><span class="type-badge ${transaction.type}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span></td>
                        <td class="amount ${transaction.type}">$${transaction.amount}</td>
                        <td>${transaction.description || '-'}</td>
                    </tr>`;
                });

                html += '</tbody></table>';
            } else {
                html += '<p>No transactions found for this category.</p>';
            }
            html += '</div>';

            document.getElementById('categoryDetails').innerHTML = html;
            document.getElementById('detailsModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching category details:', error);
            alert('Error loading category details');
        });
}

function closeModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

document.getElementById('categoryForm').addEventListener('submit', function(e) {
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
            alert('Error updating category');
        });
    }
});

window.addEventListener('click', function(e) {
    const categoryModal = document.getElementById('categoryModal');
    const detailsModal = document.getElementById('detailsModal');

    if (e.target === categoryModal) {
        closeModal();
    }
    if (e.target === detailsModal) {
        closeDetailsModal();
    }
});