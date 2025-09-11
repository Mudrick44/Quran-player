import SideNavbar from "./components/sideNavbar";
import TopNavbar from "./components/topNavbar";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SideNavbar />
      <div className="flex-1 flex flex-col">
        <TopNavbar />
        <main className="flex-1 p-6">
          {/* Main content area */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Quran Player
            </h2>
            <p className="text-gray-600">
              Your Apple Music-inspired Quran player is ready!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
