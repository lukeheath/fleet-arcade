const API_TOKEN = import.meta.env.VITE_FLEET_API_TOKEN;

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

export async function fetchHosts(onProgress) {
  const perPage = 100;
  let page = 0;
  let allHosts = [];
  let hasMore = true;

  while (hasMore) {
    if (onProgress) onProgress(`SCANNING SECTOR ${page + 1}...`);

    const res = await fetch(`/api/v1/fleet/hosts?per_page=${perPage}&page=${page}`, { headers });
    if (!res.ok) throw new Error(`Fleet API error: ${res.status}`);

    const data = await res.json();
    const hosts = data.hosts || [];
    allHosts = allHosts.concat(hosts);
    hasMore = hosts.length === perPage;
    page++;
  }

  return allHosts;
}

export async function fetchHostDetails(hostId) {
  const res = await fetch(`/api/v1/fleet/hosts/${hostId}`, { headers });
  if (!res.ok) throw new Error(`Fleet API error: ${res.status}`);
  const data = await res.json();
  return data.host;
}
