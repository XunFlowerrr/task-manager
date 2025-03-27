export default async function userLogIn(
  userEmail: string,
  userPassword: string
) {
  const response = await fetch(`http://localhost:5000/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userEmail,
      password: userPassword,
    }),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to login");
  }

  // Don't use localStorage in server-side code
  // We'll store the token in the session instead
  // and handle localStorage in client components

  // Return user object with necessary data for NextAuth
  return {
    id: data.userId || "user",
    email: userEmail,
    name: data.name || userEmail,
    token: data.token,
  };
}
