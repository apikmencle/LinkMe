export default function TrafficRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: true,
    },
  };
}
