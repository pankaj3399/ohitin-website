import CinematicTrailer from '../../components/Trailer';

interface HomeProps {
  scene?: 1 | 2 | 3;
}

function Home({ scene = 1 }: HomeProps) {
  return (
    <div className="min-h-screen w-full bg-black">
      <CinematicTrailer scene={scene} />
    </div>
  );
}

export default Home;
