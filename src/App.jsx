import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[85vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
