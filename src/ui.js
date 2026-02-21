// UI management: HUD, detail panel, tooltip, legend

import { getFleetColor, getShipType } from './ships.js';

export function updateHUD(hosts) {
  const total = hosts.length;
  const online = hosts.filter((h) => h.status === 'online').length;
  const totalIssues = hosts.reduce((sum, h) => sum + (h.issues?.total_issues_count || 0), 0);

  document.getElementById('hud-hosts').textContent = `HOSTS: ${total}`;
  document.getElementById('hud-online').textContent = `ONLINE: ${online}`;
  document.getElementById('hud-issues').textContent = `ISSUES: ${totalIssues}`;
}

export function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  document.getElementById('hud-time').textContent = time;
}

// onToggle callback: (fleetName, visible) => void
export function buildLegend(fleetNames, onToggle) {
  const container = document.getElementById('fleet-legend');
  container.innerHTML = '';

  for (const name of fleetNames) {
    const colors = getFleetColor(name);
    const item = document.createElement('div');
    item.className = 'legend-item legend-toggle';
    item.dataset.fleet = name;
    item.dataset.active = 'true';

    const swatch = document.createElement('div');
    swatch.className = 'legend-swatch';
    swatch.style.backgroundColor = colors.primary;
    swatch.style.color = colors.primary;

    const label = document.createElement('span');
    label.textContent = name;
    label.style.color = colors.primary;
    label.style.textShadow = `0 0 6px ${colors.primary}`;

    item.appendChild(swatch);
    item.appendChild(label);
    container.appendChild(item);

    item.addEventListener('click', () => {
      const isActive = item.dataset.active === 'true';
      const nowActive = !isActive;
      item.dataset.active = String(nowActive);

      if (nowActive) {
        item.classList.remove('legend-stealth');
        swatch.style.backgroundColor = colors.primary;
        label.style.color = colors.primary;
        label.style.textShadow = `0 0 6px ${colors.primary}`;
      } else {
        item.classList.add('legend-stealth');
        swatch.style.backgroundColor = '#333';
        label.style.color = '#444';
        label.style.textShadow = 'none';
      }

      if (onToggle) onToggle(name, nowActive);
    });
  }

  // Platform legend
  const platforms = [
    { name: 'MAC', type: 'fighter' },
    { name: 'WIN', type: 'cruiser' },
    { name: 'LINUX', type: 'stealth' },
    { name: 'MOBILE', type: 'interceptor' },
    { name: 'CHROME', type: 'drone' },
  ];

  const sep = document.createElement('div');
  sep.className = 'legend-item';
  sep.innerHTML = '<span style="color: #444; margin: 0 8px;">|</span>';
  container.appendChild(sep);

  for (const p of platforms) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const label = document.createElement('span');
    label.textContent = `${p.type.toUpperCase()} = ${p.name}`;
    label.style.color = '#668899';
    item.appendChild(label);
    container.appendChild(item);
  }
}

export function showTooltip(x, y, host) {
  const tooltip = document.getElementById('tooltip');
  tooltip.classList.remove('hidden');

  const status = host.status === 'online'
    ? '<span class="status-online">● ONLINE</span>'
    : '<span class="status-offline">● OFFLINE</span>';

  const issues = host.issues?.total_issues_count || 0;
  const vulns = host.issues?.critical_vulnerabilities_count || 0;
  const issueText = issues > 0
    ? `<br>ISSUES: <span class="${vulns > 0 ? 'vuln-critical' : 'vuln-warning'}">${issues}</span>`
    : '';

  tooltip.innerHTML = `
    <div class="tooltip-name">${escapeHtml(host.display_name || host.hostname)}</div>
    <div class="tooltip-info">
      ${status}<br>
      ${host.platform?.toUpperCase()} · ${host.os_version || 'Unknown OS'}
      ${issueText}
    </div>
  `;

  // Position tooltip near cursor but keep on screen
  const pad = 15;
  let tx = x + pad;
  let ty = y - 10;
  const rect = tooltip.getBoundingClientRect();
  if (tx + rect.width > window.innerWidth - 20) tx = x - rect.width - pad;
  if (ty + rect.height > window.innerHeight - 20) ty = y - rect.height;
  if (ty < 10) ty = 10;

  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';
}

export function hideTooltip() {
  document.getElementById('tooltip').classList.add('hidden');
}

export function showDetailPanel(host) {
  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');
  panel.classList.remove('hidden');

  // Remove old backdrop
  const oldBackdrop = document.getElementById('detail-backdrop');
  if (oldBackdrop) oldBackdrop.remove();

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'detail-backdrop';
  backdrop.onclick = () => hideDetailPanel();
  document.body.appendChild(backdrop);

  const statusClass = host.status === 'online' ? 'status-online' : 'status-offline';
  const statusIcon = host.status === 'online' ? '●' : '○';

  const issues = host.issues || {};
  const vulnClass = issues.critical_vulnerabilities_count > 0
    ? 'vuln-critical'
    : issues.total_issues_count > 0
    ? 'vuln-warning'
    : 'vuln-ok';

  const diskPct = host.percent_disk_space_available || 0;
  const diskClass = diskPct < 15 ? 'vuln-critical' : diskPct < 30 ? 'vuln-warning' : 'vuln-ok';

  const memory = host.memory ? formatBytes(host.memory) : 'Unknown';
  const uptime = host.uptime ? formatUptime(host.uptime) : 'Unknown';

  const geoText = host.geolocation
    ? `${host.geolocation.city_name || 'Unknown'}, ${host.geolocation.country_iso || ''}`
    : 'Unknown';

  const mdmStatus = host.mdm?.enrollment_status || 'Not enrolled';
  const mdmEncryption = host.mdm?.encryption_key_available ? 'YES' : 'NO';

  content.innerHTML = `
    <div class="detail-header">
      <span class="detail-hostname">${escapeHtml(host.display_name || host.hostname)}</span>
      <span class="detail-close" onclick="document.getElementById('detail-panel').classList.add('hidden'); document.getElementById('detail-backdrop')?.remove();">[X] CLOSE</span>
    </div>
    <div class="detail-body">
      <div class="detail-section">
        <div class="detail-section-title">// IDENTIFICATION</div>
        <div class="detail-row"><span class="detail-label">HOSTNAME</span><span class="detail-value">${escapeHtml(host.hostname)}</span></div>
        <div class="detail-row"><span class="detail-label">DISPLAY NAME</span><span class="detail-value">${escapeHtml(host.display_name || host.hostname)}</span></div>
        <div class="detail-row"><span class="detail-label">STATUS</span><span class="detail-value ${statusClass}">${statusIcon} ${host.status?.toUpperCase()}</span></div>
        <div class="detail-row"><span class="detail-label">FLEET</span><span class="detail-value">${escapeHtml(host.fleet_name || host.team_name || 'No team')}</span></div>
        <div class="detail-row"><span class="detail-label">SERIAL</span><span class="detail-value">${host.hardware_serial || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">UUID</span><span class="detail-value">${host.uuid || 'N/A'}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">// HARDWARE</div>
        <div class="detail-row"><span class="detail-label">PLATFORM</span><span class="detail-value">${host.platform?.toUpperCase() || 'Unknown'}</span></div>
        <div class="detail-row"><span class="detail-label">OS</span><span class="detail-value">${host.os_version || 'Unknown'}</span></div>
        <div class="detail-row"><span class="detail-label">MODEL</span><span class="detail-value">${host.hardware_model || 'Unknown'}</span></div>
        <div class="detail-row"><span class="detail-label">CPU</span><span class="detail-value">${host.cpu_brand || 'Unknown'}</span></div>
        <div class="detail-row"><span class="detail-label">CORES</span><span class="detail-value">${host.cpu_physical_cores || '?'} PHYSICAL / ${host.cpu_logical_cores || '?'} LOGICAL</span></div>
        <div class="detail-row"><span class="detail-label">MEMORY</span><span class="detail-value">${memory}</span></div>
        <div class="detail-row"><span class="detail-label">VENDOR</span><span class="detail-value">${host.hardware_vendor || 'Unknown'}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">// STORAGE</div>
        <div class="detail-row"><span class="detail-label">TOTAL DISK</span><span class="detail-value">${host.gigs_total_disk_space?.toFixed(1) || '?'} GB</span></div>
        <div class="detail-row"><span class="detail-label">AVAILABLE</span><span class="detail-value ${diskClass}">${host.gigs_disk_space_available?.toFixed(1) || '?'} GB (${diskPct}%)</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">// SECURITY STATUS</div>
        <div class="detail-row"><span class="detail-label">TOTAL ISSUES</span><span class="detail-value ${vulnClass}">${issues.total_issues_count || 0}</span></div>
        <div class="detail-row"><span class="detail-label">CRITICAL VULNS</span><span class="detail-value ${issues.critical_vulnerabilities_count > 0 ? 'vuln-critical' : 'vuln-ok'}">${issues.critical_vulnerabilities_count || 0}</span></div>
        <div class="detail-row"><span class="detail-label">FAILING POLICIES</span><span class="detail-value ${issues.failing_policies_count > 0 ? 'vuln-warning' : 'vuln-ok'}">${issues.failing_policies_count || 0}</span></div>
        <div class="detail-row"><span class="detail-label">MDM</span><span class="detail-value">${mdmStatus}</span></div>
        <div class="detail-row"><span class="detail-label">DISK ENCRYPTED</span><span class="detail-value">${mdmEncryption}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">// NETWORK & LOCATION</div>
        <div class="detail-row"><span class="detail-label">PUBLIC IP</span><span class="detail-value">${host.public_ip || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">PRIVATE IP</span><span class="detail-value">${host.primary_ip || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">MAC ADDR</span><span class="detail-value">${host.primary_mac || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">LOCATION</span><span class="detail-value">${geoText}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">// SYSTEM</div>
        <div class="detail-row"><span class="detail-label">UPTIME</span><span class="detail-value">${uptime}</span></div>
        <div class="detail-row"><span class="detail-label">LAST SEEN</span><span class="detail-value">${formatDate(host.seen_time)}</span></div>
        <div class="detail-row"><span class="detail-label">LAST RESTART</span><span class="detail-value">${formatDate(host.last_restarted_at)}</span></div>
        <div class="detail-row"><span class="detail-label">OSQUERY</span><span class="detail-value">${host.osquery_version || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">SHIP CLASS</span><span class="detail-value">${getShipType(host.platform).toUpperCase()}</span></div>
      </div>
    </div>
  `;
}

export function hideDetailPanel() {
  document.getElementById('detail-panel').classList.add('hidden');
  document.getElementById('detail-backdrop')?.remove();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatBytes(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
  return bytes + ' B';
}

function formatUptime(nanoseconds) {
  const seconds = nanoseconds / 1e9;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
