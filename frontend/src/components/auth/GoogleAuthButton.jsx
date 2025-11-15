export default function GoogleAuthButton() {
  const API = import.meta.env.VITE_BACKEND_URL;
  return (
    <button
      onClick={() =>
        (window.location.href = `${API}/auth/continue-with-google`)
      }
      className="flex items-center justify-center w-full max-w-sm mx-auto py-3 px-4 hover:bg-gray-50 text-black font-semibold rounded-md border border-gray-300"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
        className="w-5 h-5 mr-2"
      />
      Continue with Google
    </button>
  );
}
