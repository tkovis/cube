const get = async (route) => {
  const res = await fetch(route);
  const json = await res.json();
  return { status: res.status, json };
};

const post = async (route, body) => {
  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
};

export default { get, post };
