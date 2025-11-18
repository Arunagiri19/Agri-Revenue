import { useState, useEffect } from 'react';

function App() {
    const products = [
        { id: 1, name: 'கோவக்காய்', image: 'https://images.pexels.com/photos/1359326/pexels-photo-1359326.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: 2, name: 'புடலங்காய்', image: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: 3, name: 'வேர்கடலை', image: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: 4, name: 'பாகற்காய்', image: 'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: 5, name: 'சுரைக்காய்', image: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400' }
    ];

    const [activeTab, setActiveTab] = useState('harvest');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [harvestData, setHarvestData] = useState({
        kg: '',
        rate: '',
        commission: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [expenseData, setExpenseData] = useState({
        fertilizer: '',
        labor: '',
        other: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [editingHarvestId, setEditingHarvestId] = useState(null);

    // Load data from localStorage
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('harvestHistory');
        return saved ? JSON.parse(saved) : [];
    });

    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('expensesHistory');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to localStorage whenever history changes
    useEffect(() => {
        localStorage.setItem('harvestHistory', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('expensesHistory', JSON.stringify(expenses));
    }, [expenses]);

    const handleHarvestSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || !harvestData.kg || !harvestData.rate) {
            alert('Please select a product and fill all fields');
            return;
        }

        if (editingHarvestId) {
            // Update existing record
            const updatedHistory = history.map(item =>
                item.id === editingHarvestId
                    ? {
                        ...item,
                        kg: parseFloat(harvestData.kg),
                        rate: parseFloat(harvestData.rate),
                        commission: parseFloat(harvestData.commission) || 0,
                        grossTotal: parseFloat(harvestData.kg) * parseFloat(harvestData.rate),
                        total: (parseFloat(harvestData.kg) * parseFloat(harvestData.rate)) - (parseFloat(harvestData.commission) || 0),
                        date: harvestData.date
                    }
                    : item
            );
            setHistory(updatedHistory);
            setEditingHarvestId(null);
            alert('Harvest record updated successfully!');
        } else {
            // Create new record
            const newEntry = {
                id: Date.now(),
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                kg: parseFloat(harvestData.kg),
                rate: parseFloat(harvestData.rate),
                commission: parseFloat(harvestData.commission) || 0,
                grossTotal: parseFloat(harvestData.kg) * parseFloat(harvestData.rate),
                total: (parseFloat(harvestData.kg) * parseFloat(harvestData.rate)) - (parseFloat(harvestData.commission) || 0),
                date: harvestData.date,
                type: 'harvest'
            };
            setHistory([newEntry, ...history]);
            alert('Harvest recorded successfully!');
        }

        setHarvestData({ kg: '', rate: '', commission: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || (!expenseData.fertilizer && !expenseData.labor && !expenseData.other)) {
            alert('Please select a product and enter at least one expense');
            return;
        }

        const newExpense = {
            id: Date.now(),
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            fertilizer: parseFloat(expenseData.fertilizer) || 0,
            labor: parseFloat(expenseData.labor) || 0,
            other: parseFloat(expenseData.other) || 0,
            total: (parseFloat(expenseData.fertilizer) || 0) +
                (parseFloat(expenseData.labor) || 0) +
                (parseFloat(expenseData.other) || 0),
            date: expenseData.date,
            type: 'expense'
        };

        setExpenses([newExpense, ...expenses]);
        setExpenseData({ fertilizer: '', labor: '', other: '', date: new Date().toISOString().split('T')[0] });
        alert('Expense recorded successfully!');
    };

    const handleEditHarvest = (entry) => {
        setActiveTab('harvest');
        setSelectedProduct(products.find(p => p.id === entry.productId));
        setHarvestData({
            kg: entry.kg.toString(),
            rate: entry.rate.toString(),
            commission: entry.commission ? entry.commission.toString() : '',
            date: entry.date
        });
        setEditingHarvestId(entry.id);
    };

    // Delete functionality removed to preserve historical data
    const handleDelete = (id, type) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            if (type === 'harvest') {
                setHistory(history.filter(item => item.id !== id));
            } else {
                setExpenses(expenses.filter(item => item.id !== id));
            }
        }
    };

    const calculateProfitLoss = (productId) => {
        const productHarvest = history
            .filter(h => h.productId === productId)
            .reduce((sum, h) => sum + h.total, 0);

        const productExpenses = expenses
            .filter(e => e.productId === productId)
            .reduce((sum, e) => sum + e.total, 0);

        return productHarvest - productExpenses;
    };

    const generateShareText = () => {
        let shareText = '🌾 AGRICULTURE HARVEST REPORT 🌾\n';
        shareText += '='.repeat(40) + '\n\n';

        products.forEach(product => {
            const productHistory = history.filter(h => h.productId === product.id);
            const productExpenses = expenses.filter(e => e.productId === product.id);

            if (productHistory.length > 0 || productExpenses.length > 0) {
                shareText += `📦 ${product.name}\n`;
                shareText += '-'.repeat(40) + '\n';

                const totalKg = productHistory.reduce((sum, h) => sum + h.kg, 0);
                const totalRevenue = productHistory.reduce((sum, h) => sum + h.total, 0);
                const totalExpense = productExpenses.reduce((sum, e) => sum + e.total, 0);
                const profitLoss = totalRevenue - totalExpense;

                shareText += `Total Harvested: ${totalKg.toFixed(2)} kg\n`;
                shareText += `Total Revenue: ₹${totalRevenue.toFixed(2)}\n`;
                shareText += `Total Expenses: ₹${totalExpense.toFixed(2)}\n`;
                shareText += `${profitLoss >= 0 ? 'Profit' : 'Loss'}: ₹${Math.abs(profitLoss).toFixed(2)}\n\n`;
            }
        });

        const grandRevenue = history.reduce((sum, h) => sum + h.total, 0);
        const grandExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
        const grandProfitLoss = grandRevenue - grandExpenses;

        shareText += '='.repeat(40) + '\n';
        shareText += `💰 TOTAL ${grandProfitLoss >= 0 ? 'PROFIT' : 'LOSS'}: ₹${Math.abs(grandProfitLoss).toFixed(2)}\n`;
        shareText += '='.repeat(40);

        return shareText;
    };

    const copyToClipboard = () => {
        const text = generateShareText();
        navigator.clipboard.writeText(text).then(() => {
            alert('Report copied to clipboard!');
        });
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>🌾ஆறுமுகம் விவசாயி </h1>
                <p>உங்கள் தினசரி விளைச்சல், செலவு, லாபம்-நட்டத்தை பதிவு செய்யுங்கள்.</p>
            </header>

            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'harvest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('harvest')}
                >
                    📊 Record Harvest
                </button>
                <button
                    className={`tab-button ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    💸 Record Expenses
                </button>
                <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 View History
                </button>
                <button
                    className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveTab('report')}
                >
                    📈 Profit/Loss Report
                </button>
                <button
                    className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    📅 Monthly Statement
                </button>
            </div>

            {(activeTab === 'harvest' || activeTab === 'expense') && (
                <>
                    <h2 style={{ marginBottom: '1rem', color: '#333' }}>Select Product</h2>
                    <div className="product-grid">
                        {products.map(product => (
                            <div
                                key={product.id}
                                className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                                onClick={() => setSelectedProduct(product)}
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="product-image"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=400&background=667eea&color=fff&bold=true&font-size=0.4`;
                                    }}
                                />
                                <h3>{product.name}</h3>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'harvest' && selectedProduct && (
                <div className="form-section">
                    <h2>{editingHarvestId ? 'Edit' : 'Record'} Harvest - {selectedProduct.name}</h2>
                    <form onSubmit={handleHarvestSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={harvestData.date}
                                    onChange={(e) => setHarvestData({ ...harvestData, date: e.target.value })}
                                    required
                                />
                                {harvestData.date && (
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                        Selected: {new Date(harvestData.date + 'T00:00:00').toLocaleDateString('en-GB')}
                                    </p>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Quantity (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter kg"
                                    value={harvestData.kg}
                                    onChange={(e) => setHarvestData({ ...harvestData, kg: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Rate per kg (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter rate"
                                    value={harvestData.rate}
                                    onChange={(e) => setHarvestData({ ...harvestData, rate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Buyer's Commission (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter commission"
                                    value={harvestData.commission}
                                    onChange={(e) => setHarvestData({ ...harvestData, commission: e.target.value })}
                                />
                            </div>
                        </div>
                        {harvestData.kg && harvestData.rate && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                    Gross Total: ₹{(parseFloat(harvestData.kg) * parseFloat(harvestData.rate)).toFixed(2)}
                                </p>
                                {harvestData.commission && (
                                    <p style={{ fontSize: '1.1rem', color: '#f56565' }}>
                                        Buyer's Commission: -₹{parseFloat(harvestData.commission).toFixed(2)}
                                    </p>
                                )}
                                <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#667eea' }}>
                                    Net Amount: ₹{((parseFloat(harvestData.kg) * parseFloat(harvestData.rate)) - (parseFloat(harvestData.commission) || 0)).toFixed(2)}
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingHarvestId ? 'Update Harvest' : 'Save Harvest'}
                            </button>
                            {editingHarvestId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setEditingHarvestId(null);
                                        setHarvestData({ kg: '', rate: '', commission: '', date: new Date().toISOString().split('T')[0] });
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'expense' && selectedProduct && (
                <div className="form-section">
                    <h2>Record Expenses - {selectedProduct.name}</h2>
                    <form onSubmit={handleExpenseSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={expenseData.date}
                                    onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Fertilizer Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={expenseData.fertilizer}
                                    onChange={(e) => setExpenseData({ ...expenseData, fertilizer: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Labor Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={expenseData.labor}
                                    onChange={(e) => setExpenseData({ ...expenseData, labor: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Other Costs (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={expenseData.other}
                                    onChange={(e) => setExpenseData({ ...expenseData, other: e.target.value })}
                                />
                            </div>
                        </div>
                        {(expenseData.fertilizer || expenseData.labor || expenseData.other) && (
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f56565', marginBottom: '1rem' }}>
                                Total Expense: ₹{((parseFloat(expenseData.fertilizer) || 0) +
                                    (parseFloat(expenseData.labor) || 0) +
                                    (parseFloat(expenseData.other) || 0)).toFixed(2)}
                            </p>
                        )}
                        <button type="submit" className="btn btn-primary">Save Expense</button>
                    </form>
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    <div className="history-section">
                        <h3>🌾 Harvest History</h3>
                        {history.length === 0 ? (
                            <div className="empty-state">
                                <p>No harvest records yet</p>
                            </div>
                        ) : (
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Quantity (kg)</th>
                                        <th>Rate (₹/kg)</th>
                                        <th>Gross (₹)</th>
                                        <th>Commission (₹)</th>
                                        <th>Net (₹)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(entry => (
                                        <tr key={entry.id}>
                                            <td>{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                            <td>{entry.productName}</td>
                                            <td>{entry.kg.toFixed(2)}</td>
                                            <td>{entry.rate.toFixed(2)}</td>
                                            <td>₹{(entry.grossTotal || entry.total).toFixed(2)}</td>
                                            <td className="loss">₹{(entry.commission || 0).toFixed(2)}</td>
                                            <td className="profit">₹{entry.total.toFixed(2)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleEditHarvest(entry)}
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDelete(entry.id, 'harvest')}
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="history-section">
                        <h3>💸 Expense History</h3>
                        {expenses.length === 0 ? (
                            <div className="empty-state">
                                <p>No expense records yet</p>
                            </div>
                        ) : (
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Fertilizer (₹)</th>
                                        <th>Labor (₹)</th>
                                        <th>Other (₹)</th>
                                        <th>Total (₹)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(entry => (
                                        <tr key={entry.id}>
                                            <td>{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                            <td>{entry.productName}</td>
                                            <td>{entry.fertilizer.toFixed(2)}</td>
                                            <td>{entry.labor.toFixed(2)}</td>
                                            <td>{entry.other.toFixed(2)}</td>
                                            <td className="loss">₹{entry.total.toFixed(2)}</td>
                                            <td>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(entry.id, 'expense')}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'monthly' && (
                <div>
                    <div className="form-section">
                        <h2>📅 Monthly Profit/Loss Statement</h2>
                        <div className="form-group" style={{ maxWidth: '300px', marginBottom: '2rem' }}>
                            <label>Select Month</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                style={{ padding: '0.8rem', border: '2px solid #667eea', borderRadius: '8px', fontSize: '1rem' }}
                            />
                        </div>

                        {(() => {
                            const monthlyHarvest = history.filter(h => h.date.startsWith(selectedMonth));
                            const monthlyExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
                            const totalGrossRevenue = monthlyHarvest.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                            const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.total, 0);
                            const totalCommission = monthlyHarvest.reduce((sum, h) => sum + (h.commission || 0), 0);
                            const netProfit = totalGrossRevenue - totalCommission - totalExpense;

                            return (
                                <>
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <h4>Monthly Revenue</h4>
                                            <p>₹{totalGrossRevenue.toFixed(2)}</p>
                                        </div>
                                        <div className="stat-card">
                                            <h4>Monthly Expenses</h4>
                                            <p>₹{totalExpense.toFixed(2)}</p>
                                        </div>
                                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' }}>
                                            <h4>Total Commission</h4>
                                            <p>₹{totalCommission.toFixed(2)}</p>
                                        </div>
                                        <div className="stat-card" style={{ background: netProfit >= 0 ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' }}>
                                            <h4>Net {netProfit >= 0 ? 'Profit' : 'Loss'}</h4>
                                            <p>₹{Math.abs(netProfit).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3>Product-wise Monthly Breakdown</h3>
                                        <table className="history-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Harvest (kg)</th>
                                                    <th>Revenue (₹)</th>
                                                    <th>Commission (₹)</th>
                                                    <th>Expenses (₹)</th>
                                                    <th>Net Profit/Loss (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map(product => {
                                                    const productHarvest = monthlyHarvest.filter(h => h.productId === product.id);
                                                    const productExpenses = monthlyExpenses.filter(e => e.productId === product.id);

                                                    if (productHarvest.length === 0 && productExpenses.length === 0) return null;

                                                    const totalKg = productHarvest.reduce((sum, h) => sum + h.kg, 0);
                                                    const grossRevenue = productHarvest.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                                                    const commission = productHarvest.reduce((sum, h) => sum + (h.commission || 0), 0);
                                                    const expense = productExpenses.reduce((sum, e) => sum + e.total, 0);
                                                    const profitLoss = grossRevenue - commission - expense;

                                                    return (
                                                        <tr key={product.id}>
                                                            <td>{product.name}</td>
                                                            <td>{totalKg.toFixed(2)}</td>
                                                            <td className="profit">₹{grossRevenue.toFixed(2)}</td>
                                                            <td className="loss">₹{commission.toFixed(2)}</td>
                                                            <td className="loss">₹{expense.toFixed(2)}</td>
                                                            <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                                                                ₹{profitLoss.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {monthlyHarvest.length > 0 && (
                                        <div className="history-section">
                                            <h3>🌾 Harvest Details - {selectedMonth}</h3>
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Product</th>
                                                        <th>Quantity (kg)</th>
                                                        <th>Rate (₹/kg)</th>
                                                        <th>Gross (₹)</th>
                                                        <th>Commission (₹)</th>
                                                        <th>Net (₹)</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthlyHarvest.map(entry => (
                                                        <tr key={entry.id}>
                                                            <td>{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                                            <td>{entry.productName}</td>
                                                            <td>{entry.kg.toFixed(2)}</td>
                                                            <td>{entry.rate.toFixed(2)}</td>
                                                            <td>₹{(entry.grossTotal || entry.total).toFixed(2)}</td>
                                                            <td className="loss">₹{(entry.commission || 0).toFixed(2)}</td>
                                                            <td className="profit">₹{entry.total.toFixed(2)}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={() => handleEditHarvest(entry)}
                                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-danger"
                                                                        onClick={() => handleDelete(entry.id, 'harvest')}
                                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {monthlyExpenses.length > 0 && (
                                        <div className="history-section">
                                            <h3>💸 Expense Details - {selectedMonth}</h3>
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Product</th>
                                                        <th>Fertilizer (₹)</th>
                                                        <th>Labor (₹)</th>
                                                        <th>Other (₹)</th>
                                                        <th>Total (₹)</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthlyExpenses.map(entry => (
                                                        <tr key={entry.id}>
                                                            <td>{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                                            <td>{entry.productName}</td>
                                                            <td>{entry.fertilizer.toFixed(2)}</td>
                                                            <td>{entry.labor.toFixed(2)}</td>
                                                            <td>{entry.other.toFixed(2)}</td>
                                                            <td className="loss">₹{entry.total.toFixed(2)}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-danger"
                                                                    onClick={() => handleDelete(entry.id, 'expense')}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <div className="share-section">
                                        <h3>📤 Download Monthly Statement</h3>
                                        <div className="share-content">
                                            {(() => {
                                                const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                let statement = `🌾 MONTHLY PROFIT/LOSS STATEMENT\n`;
                                                statement += `📅 Period: ${monthName}\n`;
                                                statement += '='.repeat(50) + '\n\n';

                                                statement += `💰 SUMMARY\n`;
                                                statement += '-'.repeat(50) + '\n';
                                                statement += `Total Revenue:    ₹${totalGrossRevenue.toFixed(2)}\n`;
                                                statement += `Total Commission: ₹${totalCommission.toFixed(2)}\n`;
                                                statement += `Total Expenses:   ₹${totalExpense.toFixed(2)}\n`;
                                                statement += `Net ${netProfit >= 0 ? 'Profit' : 'Loss'}:        ₹${Math.abs(netProfit).toFixed(2)}\n\n`;

                                                statement += `📦 PRODUCT-WISE BREAKDOWN\n`;
                                                statement += '-'.repeat(50) + '\n';
                                                products.forEach(product => {
                                                    const productHarvest = monthlyHarvest.filter(h => h.productId === product.id);
                                                    const productExpenses = monthlyExpenses.filter(e => e.productId === product.id);

                                                    if (productHarvest.length > 0 || productExpenses.length > 0) {
                                                        const totalKg = productHarvest.reduce((sum, h) => sum + h.kg, 0);
                                                        const grossRevenue = productHarvest.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                                                        const commission = productHarvest.reduce((sum, h) => sum + (h.commission || 0), 0);
                                                        const expense = productExpenses.reduce((sum, e) => sum + e.total, 0);
                                                        const profitLoss = grossRevenue - commission - expense;

                                                        statement += `\n${product.name}:\n`;
                                                        statement += `  Harvested: ${totalKg.toFixed(2)} kg\n`;
                                                        statement += `  Revenue:   ₹${grossRevenue.toFixed(2)}\n`;
                                                        statement += `  Commission: ₹${commission.toFixed(2)}\n`;
                                                        statement += `  Expenses:  ₹${expense.toFixed(2)}\n`;
                                                        statement += `  ${profitLoss >= 0 ? 'Profit' : 'Loss'}:     ₹${Math.abs(profitLoss).toFixed(2)}\n`;
                                                    }
                                                });

                                                statement += '\n' + '='.repeat(50);
                                                return statement;
                                            })()}
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                let statement = `🌾 MONTHLY PROFIT/LOSS STATEMENT\n`;
                                                statement += `📅 Period: ${monthName}\n`;
                                                statement += '='.repeat(50) + '\n\n';

                                                const totalGrossRevenue = monthlyHarvest.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                                                const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.total, 0);
                                                const totalCommission = monthlyHarvest.reduce((sum, h) => sum + (h.commission || 0), 0);
                                                const netProfit = totalGrossRevenue - totalCommission - totalExpense;

                                                statement += `💰 SUMMARY\n`;
                                                statement += '-'.repeat(50) + '\n';
                                                statement += `Total Revenue:    ₹${totalGrossRevenue.toFixed(2)}\n`;
                                                statement += `Total Commission: ₹${totalCommission.toFixed(2)}\n`;
                                                statement += `Total Expenses:   ₹${totalExpense.toFixed(2)}\n`;
                                                statement += `Net ${netProfit >= 0 ? 'Profit' : 'Loss'}:        ₹${Math.abs(netProfit).toFixed(2)}\n\n`;

                                                statement += `📦 PRODUCT-WISE BREAKDOWN\n`;
                                                statement += '-'.repeat(50) + '\n';
                                                products.forEach(product => {
                                                    const productHarvest = monthlyHarvest.filter(h => h.productId === product.id);
                                                    const productExpenses = monthlyExpenses.filter(e => e.productId === product.id);

                                                    if (productHarvest.length > 0 || productExpenses.length > 0) {
                                                        const totalKg = productHarvest.reduce((sum, h) => sum + h.kg, 0);
                                                        const grossRevenue = productHarvest.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                                                        const commission = productHarvest.reduce((sum, h) => sum + (h.commission || 0), 0);
                                                        const expense = productExpenses.reduce((sum, e) => sum + e.total, 0);
                                                        const profitLoss = grossRevenue - commission - expense;

                                                        statement += `\n${product.name}:\n`;
                                                        statement += `  Harvested: ${totalKg.toFixed(2)} kg\n`;
                                                        statement += `  Revenue:   ₹${grossRevenue.toFixed(2)}\n`;
                                                        statement += `  Commission: ₹${commission.toFixed(2)}\n`;
                                                        statement += `  Expenses:  ₹${expense.toFixed(2)}\n`;
                                                        statement += `  ${profitLoss >= 0 ? 'Profit' : 'Loss'}:     ₹${Math.abs(profitLoss).toFixed(2)}\n`;
                                                    }
                                                });

                                                statement += '\n' + '='.repeat(50);

                                                navigator.clipboard.writeText(statement).then(() => {
                                                    alert('Monthly statement copied to clipboard!');
                                                });
                                            }}
                                        >
                                            📋 Copy Monthly Statement
                                        </button>
                                    </div>

                                    {monthlyHarvest.length === 0 && monthlyExpenses.length === 0 && (
                                        <div className="empty-state">
                                            <p>No records found for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h4>Total Revenue</h4>
                            <p>₹{history.reduce((sum, h) => sum + (h.grossTotal || h.total), 0).toFixed(2)}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Total Expenses</h4>
                            <p>₹{expenses.reduce((sum, e) => sum + e.total, 0).toFixed(2)}</p>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' }}>
                            <h4>Total Commission</h4>
                            <p>₹{history.reduce((sum, h) => sum + (h.commission || 0), 0).toFixed(2)}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Net Profit/Loss</h4>
                            <p>
                                ₹{(history.reduce((sum, h) => sum + (h.grossTotal || h.total), 0) -
                                    history.reduce((sum, h) => sum + (h.commission || 0), 0) -
                                    expenses.reduce((sum, e) => sum + e.total, 0)).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Product-wise Profit/Loss</h2>
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Total Harvest (kg)</th>
                                    <th>Revenue (₹)</th>
                                    <th>Commission (₹)</th>
                                    <th>Expenses (₹)</th>
                                    <th>Profit/Loss (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => {
                                    const productHistory = history.filter(h => h.productId === product.id);
                                    const productExpenses = expenses.filter(e => e.productId === product.id);

                                    if (productHistory.length === 0 && productExpenses.length === 0) return null;

                                    const totalKg = productHistory.reduce((sum, h) => sum + h.kg, 0);
                                    const grossRevenue = productHistory.reduce((sum, h) => sum + (h.grossTotal || h.total), 0);
                                    const commission = productHistory.reduce((sum, h) => sum + (h.commission || 0), 0);
                                    const expense = productExpenses.reduce((sum, e) => sum + e.total, 0);
                                    const profitLoss = grossRevenue - commission - expense;

                                    return (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{totalKg.toFixed(2)}</td>
                                            <td className="profit">₹{grossRevenue.toFixed(2)}</td>
                                            <td className="loss">₹{commission.toFixed(2)}</td>
                                            <td className="loss">₹{expense.toFixed(2)}</td>
                                            <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                                                ₹{profitLoss.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="share-section">
                        <h3>📤 Share Report</h3>
                        <div className="share-content">
                            {generateShareText()}
                        </div>
                        <button className="btn btn-secondary" onClick={copyToClipboard}>
                            📋 Copy to Clipboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
