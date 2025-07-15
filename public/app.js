const { useState, useEffect } = React;
const apiBase = '/api';

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) throw new Error(await res.text() || res.statusText);
  return res.json();
};

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [workOrders, setWorkOrders] = useState([]);
  const [hoursLogs, setHoursLogs] = useState([]);
  const [releaseNotes, setReleaseNotes] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchJson(`${apiBase}/workorders`).then(setWorkOrders).catch(console.error);
    fetchJson(`${apiBase}/hours`).then(setHoursLogs).catch(console.error);
    fetchJson(`${apiBase}/releasenotes`).then(setReleaseNotes).catch(console.error);
  }, [user]);

  const refreshAll = () => {
    fetchJson(`${apiBase}/workorders`).then(setWorkOrders);
    fetchJson(`${apiBase}/hours`).then(setHoursLogs);
    fetchJson(`${apiBase}/releasenotes`).then(setReleaseNotes);
  };

  const logout = async () => {
    await fetchJson(`${apiBase}/auth/logout`, { method: 'POST' });
    setUser(null);
  };

  if (!user) return <LoginForm setUser={setUser} />;

  return (
    <div>
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Work Order Management</h1>
        <div>
          <span>{user.name} ({user.role})</span>
          <button onClick={logout} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">Logout</button>
        </div>
      </header>
      <nav className="mb-4">
        <button onClick={() => setView('dashboard')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Dashboard</button>
        {['developer', 'admin'].includes(user.role) && <button onClick={() => setView('logHours')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Log Hours</button>}
        {['customer', 'admin'].includes(user.role) && <button onClick={() => setView('submitWorkOrder')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Submit Work Order</button>}
        {['developer', 'admin'].includes(user.role) && <button onClick={() => setView('addReleaseNote')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Add Release Note</button>}
        {user.role === 'admin' && <button onClick={() => setView('manageUsers')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Manage Users</button>}
        {user.role === 'admin' && <button onClick={() => setView('monthlyOverview')} className="mr-2 bg-blue-200 px-2 py-1 rounded">Monthly Overview</button>}
      </nav>
      {view === 'dashboard' && <Dashboard workOrders={workOrders} hoursLogs={hoursLogs} releaseNotes={releaseNotes} user={user} refresh={refreshAll} />}
      {view === 'logHours' && <HoursLogForm workOrders={workOrders} refresh={refreshAll} />}
      {view === 'submitWorkOrder' && <WorkOrderForm refresh={refreshAll} />}
      {view === 'addReleaseNote' && <ReleaseNoteForm workOrders={workOrders} refresh={refreshAll} />}
      {view === 'manageUsers' && <UserManagement refresh={refreshAll} />}
      {view === 'monthlyOverview' && <MonthlyOverview />}
    </div>
  );
};

const LoginForm = ({ setUser }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const data = await fetchJson(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      setUser(data.user);
    } catch (e) {
      alert('Login failed: ' + e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">Login</h2>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="block w-full mb-2 p-2 border rounded" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="block w-full mb-2 p-2 border rounded" />
      <button onClick={login} className="bg-blue-500 text-white p-2 rounded w-full">Login</button>
    </div>
  );
};

const Dashboard = ({ workOrders, hoursLogs, releaseNotes, user, refresh }) => {
  return (
    <div>
      <section className="mb-8">
        <h2 className="text-xl mb-2">Work Orders</h2>
        <table className="w-full border-collapse border border-gray-300 table-fixed">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">ID</th>
              <th className="p-2 w-2/6 break-words overflow-hidden text-left border border-gray-200">Description</th>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">Urgency</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Customer</th>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">Status</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Date</th>
              {['developer', 'admin'].includes(user.role) && <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {workOrders.map(wo => (
              <tr key={wo.id} className="border-b">
                <td className="p-2 border border-gray-200">{wo.id}</td>
                <td className="p-2 border border-gray-200">{wo.description}</td>
                <td className="p-2 border border-gray-200">{wo.urgency}</td>
                <td className="p-2 border border-gray-200">{wo.customer}</td>
                <td className="p-2 border border-gray-200">{wo.status}</td>
                <td className="p-2 border border-gray-200">{new Date(wo.submission_date).toLocaleDateString()}</td>
                {['developer', 'admin'].includes(user.role) && <td className="p-2 border border-gray-200">
                  <select onChange={async e => {
                    if (e.target.value) {
                      await fetchJson(`${apiBase}/workorders/${wo.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: e.target.value })
                      });
                      refresh();
                    }
                  }} className="p-1 border rounded">
                    <option value="">Change Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-8">
        <h2 className="text-xl mb-2">Hours Logged</h2>
        <table className="w-full border-collapse border border-gray-300 table-fixed">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">ID</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Worker</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Date</th>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">Hours</th>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">Minutes</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Work Order</th>
            </tr>
          </thead>
          <tbody>
            {hoursLogs.map(h => (
              <tr key={h.id} className="border-b">
                <td className="p-2 border border-gray-200">{h.id}</td>
                <td className="p-2 border border-gray-200">{h.worker}</td>
                <td className="p-2 border border-gray-200">{h.date}</td>
                <td className="p-2 border border-gray-200">{h.hours}</td>
                <td className="p-2 border border-gray-200">{h.minutes}</td>
                <td className="p-2 border border-gray-200">{h.work_order_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-xl mb-2">Release Notes</h2>
        <table className="w-full border-collapse border border-gray-300 table-fixed">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">ID</th>
              <th className="p-2 w-1/12 break-words overflow-hidden text-left border border-gray-200">Work Order</th>
              <th className="p-2 w-2/12 break-words overflow-hidden text-left border border-gray-200">Problem</th>
              <th className="p-2 w-2/12 break-words overflow-hidden text-left border border-gray-200">Solution</th>
              <th className="p-2 w-2/12 break-words overflow-hidden text-left border border-gray-200">Next Steps</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Created</th>
              <th className="p-2 w-1/6 break-words overflow-hidden text-left border border-gray-200">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {releaseNotes.map(rn => <ReleaseNoteRow key={rn.id} rn={rn} />)}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const ReleaseNoteRow = ({ rn }) => {
  const [total, setTotal] = useState(null);
  useEffect(() => {
    fetchJson(`${apiBase}/hours/total/${rn.work_order_id}`).then(setTotal).catch(console.error);
  }, [rn.work_order_id]);
  return (
    <tr className="border-b">
      <td className="p-2 border border-gray-200">{rn.id}</td>
      <td className="p-2 border border-gray-200">{rn.work_order_id}</td>
      <td className="p-2 border border-gray-200">{rn.problem}</td>
      <td className="p-2 border border-gray-200">{rn.solution}</td>
      <td className="p-2 border border-gray-200">{rn.next_steps}</td>
      <td className="p-2 border border-gray-200">{new Date(rn.created_at).toLocaleDateString()}</td>
      <td className="p-2 border border-gray-200">{total ? `${total.totalHours}h ${total.totalMinutes}m` : 'Loading...'}</td>
    </tr>
  );
};

const HoursLogForm = ({ workOrders, refresh }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [workOrderId, setWorkOrderId] = useState('');

  const submit = async () => {
    if (!workOrderId || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return alert('Invalid input');
    try {
      await fetchJson(`${apiBase}/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, hours: Number(hours), minutes: Number(minutes), work_order_id: Number(workOrderId) })
      });
      refresh();
      setHours(0); setMinutes(0); setWorkOrderId('');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">Log Hours</h2>
      <label className="block mb-2">Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-1 border rounded" /></label>
      <label className="block mb-2">Hours: <input type="number" min="0" max="24" value={hours} onChange={e => setHours(e.target.value)} className="p-1 border rounded" /></label>
      <label className="block mb-2">Minutes: <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} className="p-1 border rounded" /></label>
      <label className="block mb-2">Work Order: <select value={workOrderId} onChange={e => setWorkOrderId(e.target.value)} className="p-1 border rounded w-full" >
        <option value="">Select</option>
        {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.id} - {wo.description}</option>)}
      </select></label>
      <button onClick={submit} className="bg-green-500 text-white p-2 rounded">Submit</button>
    </div>
  );
};

const WorkOrderForm = ({ refresh }) => {
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('');

  const submit = async () => {
    if (!description || !urgency) return alert('Missing fields');
    try {
      await fetchJson(`${apiBase}/workorders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, urgency })
      });
      refresh();
      setDescription(''); setUrgency('');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">Submit Work Order</h2>
      <label className="block mb-2">Description: <textarea value={description} onChange={e => setDescription(e.target.value)} className="block w-full p-1 border rounded" /></label>
      <label className="block mb-2">Urgency: <select value={urgency} onChange={e => setUrgency(e.target.value)} className="p-1 border rounded" >
        <option value="">Select</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select></label>
      <button onClick={submit} className="bg-green-500 text-white p-2 rounded">Submit</button>
    </div>
  );
};

const ReleaseNoteForm = ({ workOrders, refresh }) => {
  const [workOrderId, setWorkOrderId] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const submit = async () => {
    if (!workOrderId || !problem || !solution || !nextSteps) return alert('Missing fields');
    try {
      await fetchJson(`${apiBase}/releasenotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_order_id: Number(workOrderId), problem, solution, next_steps: nextSteps })
      });
      refresh();
      setWorkOrderId(''); setProblem(''); setSolution(''); setNextSteps('');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">Add Release Note</h2>
      <label className="block mb-2">Work Order: <select value={workOrderId} onChange={e => setWorkOrderId(e.target.value)} className="p-1 border rounded w-full" >
        <option value="">Select</option>
        {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.id} - {wo.description}</option>)}
      </select></label>
      <label className="block mb-2">Problem: <textarea value={problem} onChange={e => setProblem(e.target.value)} className="block w-full p-1 border rounded" /></label>
      <label className="block mb-2">Solution: <textarea value={solution} onChange={e => setSolution(e.target.value)} className="block w-full p-1 border rounded" /></label>
      <label className="block mb-2">Next Steps: <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} className="block w-full p-1 border rounded" /></label>
      <button onClick={submit} className="bg-green-500 text-white p-2 rounded">Submit</button>
    </div>
  );
};

const UserManagement = ({ refresh }) => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchJson(`${apiBase}/users`).then(setUsers).catch(console.error);
  }, []);

  const addUser = async () => {
    if (!name || !role || !password) return alert('Missing fields');
    try {
      await fetchJson(`${apiBase}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, password })
      });
      fetchJson(`${apiBase}/users`).then(setUsers);
      setName(''); setRole(''); setPassword('');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">Manage Users</h2>
      <div className="mb-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="mr-2 p-1 border rounded" />
        <select value={role} onChange={e => setRole(e.target.value)} className="mr-2 p-1 border rounded" >
          <option value="">Role</option>
          <option value="customer">Customer</option>
          <option value="developer">Developer</option>
          <option value="admin">Admin</option>
        </select>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="mr-2 p-1 border rounded" />
        <button onClick={addUser} className="bg-blue-500 text-white px-2 py-1 rounded">Add User</button>
      </div>
      <table className="w-full border-collapse border border-gray-300 table-fixed">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 w-1/3 break-words overflow-hidden text-left border border-gray-200">ID</th>
            <th className="p-2 w-1/3 break-words overflow-hidden text-left border border-gray-200">Name</th>
            <th className="p-2 w-1/3 break-words overflow-hidden text-left border border-gray-200">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="p-2 border border-gray-200">{u.id}</td>
              <td className="p-2 border border-gray-200">{u.name}</td>
              <td className="p-2 border border-gray-200">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MonthlyOverview = () => {
  const [allocations, setAllocations] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [transferData, setTransferData] = useState({ fromMonth: '', toMonth: '', hours: 0 });
  const [worked, setWorked] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const alloc = await fetchJson(`${apiBase}/monthly`);
        setAllocations(alloc);
        const workedPromises = months.map(async m => {
          const { totalWorked } = await fetchJson(`${apiBase}/monthly/worked/${year}/${m}`);
          return { m, totalWorked };
        });
        const workedResults = await Promise.all(workedPromises);
        const newWorked = {};
        workedResults.forEach(({ m, totalWorked }) => newWorked[m] = totalWorked);
        setWorked(newWorked);
      } catch (e) {
        console.error(e);
        alert('Error loading data: ' + e.message);
      }
    };
    loadData();
  }, [year]);

  const months = Array.from({length: 12}, (_, i) => i + 1);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getAllocation = (m) => allocations.find(a => a.year === year && a.month === m)?.available_hours || 0;

  const setAllocation = async (m, hours) => {
    await fetchJson(`${apiBase}/monthly`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, month: m, available_hours: hours }) });
    fetchJson(`${apiBase}/monthly`).then(setAllocations);
  };

  const getWorked = async (m) => {
    const { totalWorked } = await fetchJson(`${apiBase}/monthly/worked/${year}/${m}`);
    return totalWorked;
  };

  const transfer = async () => {
    await fetchJson(`${apiBase}/monthly/transfer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromYear: year, fromMonth: transferData.fromMonth, toYear: year, toMonth: transferData.toMonth, hours: transferData.hours }) });
    fetchJson(`${apiBase}/monthly`).then(setAllocations);
  };

  return (
    <div>
      <h2 className="text-xl mb-2">Monthly Overview for {year}</h2>
      <table className="w-full border-collapse border border-gray-300 mb-4 table-fixed">
        <thead>
          <tr>
            <th className="p-2 w-1/5 break-words overflow-hidden text-left border border-gray-200">Month</th>
            <th className="p-2 w-1/5 break-words overflow-hidden text-left border border-gray-200">Available</th>
            <th className="p-2 w-1/5 break-words overflow-hidden text-left border border-gray-200">Worked</th>
            <th className="p-2 w-1/5 break-words overflow-hidden text-left border border-gray-200">Remaining</th>
            <th className="p-2 w-1/5 break-words overflow-hidden text-left border border-gray-200">Set Available</th>
          </tr>
        </thead>
        <tbody>
          {months.map(m => (
            <tr key={m}>
              <td className="p-2 border border-gray-200">{monthNames[m-1]}</td>
              <td className="p-2 border border-gray-200">{getAllocation(m)}</td>
              <td className="p-2 border border-gray-200">{worked[m] || 'Loading...'}</td>
              <td className="p-2 border border-gray-200">{getAllocation(m) - (worked[m] || 0)}</td>
              <td className="p-2 border border-gray-200">
                <input type="number" defaultValue={getAllocation(m)} onBlur={e => setAllocation(m, Number(e.target.value))} className="p-1 border rounded" placeholder="Enter hours" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Transfer Hours</h3>
      <select value={transferData.fromMonth} onChange={e => setTransferData({...transferData, fromMonth: e.target.value})}>
        <option>From Month</option>{months.map(m => <option key={m} value={m}>{monthNames[m-1]}</option>)}
      </select>
      <select value={transferData.toMonth} onChange={e => setTransferData({...transferData, toMonth: e.target.value})}>
        <option>To Month</option>{months.map(m => <option key={m} value={m}>{monthNames[m-1]}</option>)}
      </select>
      <input type="number" value={transferData.hours} onChange={e => setTransferData({...transferData, hours: Number(e.target.value)})} placeholder="Hours" />
      <button onClick={transfer}>Transfer</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />); 