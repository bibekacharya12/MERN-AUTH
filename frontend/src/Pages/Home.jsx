import Header from "../Components/Header";
import Navbar from "../Components/Navbar";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url('/bg_img.png')]">
      <Navbar />
      <Header />
    </div>
  );
};
export default Home;
