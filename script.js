let PORTFOLIO_DATA = null;
let preloaderDone = null;

document.addEventListener('DOMContentLoaded', () => {
  preloaderDone = runPreloader();
  loadPortfolio();
  setupScrollProgress();

  preloaderDone.then(() => {
    const heroText = document.querySelector('.hero-text');
    const heroPhoto = document.querySelector('.hero-photo-wrap');
    if (heroText) heroText.classList.add('hero-in');
    if (heroPhoto) {
      heroPhoto.classList.add('hero-in');
      heroPhoto.addEventListener('transitionend', () => alignHeroPhoto(), { once: true });
    }
  });
});

/* ============ HERO PHOTO ALIGNMENT ============ */
function alignHeroPhoto() {
  const photoWrap = document.querySelector('.hero-photo-wrap');
  if (!photoWrap) return;

  if (window.innerWidth <= 720) {
    photoWrap.style.marginTop = '';
    photoWrap.style.height = '';
    return;
  }

  const grid = document.querySelector('.hero-grid');
  const nameEl = document.getElementById('heroName');
  const ctaRow = document.querySelector('.hero-cta-row');
  if (!grid || !nameEl || !ctaRow) return;

  const gridRect = grid.getBoundingClientRect();
  const nameRect = nameEl.getBoundingClientRect();
  const ctaRect = ctaRow.getBoundingClientRect();

  const topOffset = Math.round(nameRect.top - gridRect.top);
  const bottomOffset = Math.round(ctaRect.bottom - gridRect.top);

  photoWrap.style.marginTop = topOffset + 'px';
  photoWrap.style.height = Math.max(bottomOffset - topOffset, 0) + 'px';
}

let alignResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(alignResizeTimer);
  alignResizeTimer = setTimeout(alignHeroPhoto, 120);
});

/* ============ PRELOADER ============ */
function runPreloader() {
  return new Promise((resolve) => {
    const ticksG = document.getElementById('ticks');
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const r1 = 112, r2 = i % 3 === 0 ? 128 : 120;
      const x1 = 200 + Math.cos(angle) * r1, y1 = 200 + Math.sin(angle) * r1;
      const x2 = 200 + Math.cos(angle) * r2, y2 = 200 + Math.sin(angle) * r2;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', 'var(--pl-blue)');
      line.setAttribute('stroke-width', '1.3');
      line.setAttribute('opacity', '0.6');
      ticksG.appendChild(line);
    }

    const bladesG = document.getElementById('blades');
    const bladeCount = 14;
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * 360;
      const blade = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      blade.setAttribute('d', 'M200,200 L214,140 L206,138 L200,160 L194,138 L186,140 Z');
      blade.setAttribute('fill', '#0a1a24');
      blade.setAttribute('stroke', 'var(--pl-blue)');
      blade.setAttribute('stroke-width', '1');
      blade.setAttribute('transform', `rotate(${angle} 200 200)`);
      bladesG.appendChild(blade);
    }

    const pre = document.getElementById('preloader');
    const blFill = document.getElementById('plFill');
    const pctLabel = document.getElementById('plPct');
    const bladesEl = document.getElementById('blades');

    const DURATION = 1500;
    let start = null;

    function frame(t) {
      if (!start) start = t;
      const elapsed = t - start;
      const progress = Math.min(100, (elapsed / DURATION) * 100);

      blFill.style.width = progress + '%';
      pctLabel.textContent = Math.round(progress) + '%';

      const speed = Math.max(0.35, 2.4 - (progress / 100) * 2.05);
      bladesEl.style.animationDuration = speed + 's';

      if (progress < 100) {
        requestAnimationFrame(frame);
      } else {
        pre.classList.add('hide');
        setTimeout(resolve, 300);
      }
    }
    requestAnimationFrame(frame);
  });
}

/* ============ SCROLL PROGRESS BAR ============ */
function setupScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ============ DATA LOADING ============ */
async function loadPortfolio() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    const data = await res.json();
    PORTFOLIO_DATA = data;
    render(data);
    setupThemes(data.themes);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(alignHeroPhoto, 50));
    }
    if (preloaderDone) preloaderDone.then(() => setTimeout(alignHeroPhoto, 50));
    setTimeout(alignHeroPhoto, 300);
  } catch (err) {
    console.error('Portfolio data failed to load:', err);
    document.querySelector('.hero').innerHTML =
      '<p style="color:#ff9f43;font-family:monospace;">Could not load data.json — make sure it sits in the same folder as index.html and you are viewing this through a local server (not file://).</p>';
  }
}

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text) node.textContent = opts.text;
  if (opts.href) node.href = opts.href;
  if (opts.target) node.target = opts.target;
  if (opts.rel) node.rel = opts.rel;
  children.forEach(c => node.appendChild(c));
  return node;
}

/* Shared gradient top-bar (same accent used on Project cards) — call first for any card */
function cardTopbar() {
  return el('div', { className: 'card-topbar' });
}

/* ============ RENDER CONTENT ============ */
function render(data) {
  const avatarEl = document.getElementById('avatar');
  if (data.meta.avatarImage) {
    const img = document.createElement('img');
    img.src = data.meta.avatarImage;
    img.alt = data.meta.name;
    avatarEl.textContent = '';
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = data.meta.avatarInitials;
  }
  animateBrandName(data.meta.name);

  const navWrap = document.getElementById('navlinks');
  data.nav.forEach(item => {
    const a = el('a', { text: item.label, href: item.href });
    a.setAttribute('data-tag', item.tag);
    const li = el('li', {}, [a]);
    navWrap.appendChild(li);
  });

  const mobileNavWrap = document.getElementById('mobileMenuLinks');
  if (mobileNavWrap) {
    data.nav.forEach(item => {
      const a = el('a', { text: item.label, href: item.href });
      mobileNavWrap.appendChild(el('li', {}, [a]));
    });
  }

  document.getElementById('eyebrowIcon').innerHTML = ICONS.spark;
  document.getElementById('twPromptIcon').innerHTML = ICONS.code;
  document.getElementById('drawingNo').textContent = data.meta.drawingNo;
  document.getElementById('heroName').textContent = data.meta.name;

  if (data.meta.statusBadgeText) {
    document.getElementById('statusBadgeText').textContent = data.meta.statusBadgeText;
  } else {
    document.getElementById('statusBadge').style.display = 'none';
  }

  const taglineEl = document.getElementById('tagline');
  data.meta.taglineSegments.forEach(seg => {
    if (seg.hl) {
      taglineEl.appendChild(el('span', { className: seg.hl, text: seg.text }));
    } else {
      taglineEl.appendChild(document.createTextNode(seg.text));
    }
  });

  const ctaWrap = document.getElementById('heroCta');
  data.meta.ctaButtons.forEach((btn, i) => {
    const a = el('a', { className: 'cta-btn glow-border ' + (i === 0 ? 'cta-primary' : 'cta-secondary'), href: btn.href });
    if (btn.icon === 'download') a.setAttribute('download', '');
    a.innerHTML = ICONS[btn.icon] || '';
    a.appendChild(el('span', { text: btn.label }));
    ctaWrap.appendChild(a);
  });

  if (data.meta.socialLinks && data.meta.socialLinks.length) {
    const socialWrap = document.getElementById('heroSocial');
    if (socialWrap) {
      data.meta.socialLinks.forEach(link => {
        const a = el('a', { href: link.href, target: '_blank', rel: 'noopener' });
        a.setAttribute('aria-label', link.label);
        a.innerHTML = ICONS[link.icon] || '';
        socialWrap.appendChild(a);
      });
    }
  }

  if (data.meta.stats && data.meta.stats.length) {
    const statsWrap = document.getElementById('heroStats');
    if (statsWrap) {
      data.meta.stats.forEach(stat => {
        statsWrap.appendChild(el('div', { className: 'hstat' }, [
          el('div', { className: 'hstat-num', text: stat.num }),
          el('div', { className: 'hstat-label', text: stat.label })
        ]));
      });
    }
  }

  startTypewriter(data.meta.roles);

  /* ---- Tech marquee (moving line above About) ---- */
  if (data.techMarquee && data.techMarquee.length) {
    renderTechMarquee(data.techMarquee);
  } else {
    const marqueeWrap = document.getElementById('techMarquee');
    if (marqueeWrap) marqueeWrap.style.display = 'none';
  }

  const aboutHeadIcon = document.getElementById('aboutHeadIcon');
  if (aboutHeadIcon) aboutHeadIcon.innerHTML = ICONS.users;

  const eduHeadIcon = document.getElementById('eduHeadIcon');
  if (eduHeadIcon) eduHeadIcon.innerHTML = ICONS.gradcap;
  if (data.education && data.education.length) {
    const eduWrap = document.getElementById('educationList');
    eduWrap.innerHTML = '';
    data.education.forEach(edu => {
      if (edu.type === 'university') {
        eduWrap.appendChild(buildUniversityCard(edu));
      } else {
        eduWrap.appendChild(buildEduCard(edu));
      }
    });
  }

  if (data.about.heading) {
    document.getElementById('aboutHeading').textContent = data.about.heading;
  }
  const aboutWrap = document.getElementById('aboutParagraphs');
  data.about.paragraphs.forEach(p => aboutWrap.appendChild(el('p', { text: p })));

  if (data.about.infoGrid && data.about.infoGrid.length) {
    const infoGrid = document.getElementById('aboutInfoGrid');
    data.about.infoGrid.forEach(item => {
      infoGrid.appendChild(el('div', {}, [
        el('div', { className: 'about-info-label', text: item.label }),
        el('div', { className: 'about-info-value', text: item.value })
      ]));
    });
  }

  if (data.about.studyTags && data.about.studyTags.length) {
    const tagsWrap = document.getElementById('aboutStudyTags');
    if (tagsWrap) {
      data.about.studyTags.forEach(tag => {
        tagsWrap.appendChild(el('span', { className: 'about-study-tag', text: tag }));
      });
    }
  }

  /* ---- About photo (square, drop a file in the folder to show it) ---- */
  if (data.about.photo) {
    const aboutPhotoImg = document.getElementById('aboutPhoto');
    if (aboutPhotoImg) aboutPhotoImg.src = data.about.photo;
  }

  /* ---- About stats (2-column, count-up on scroll into view) ---- */
  if (data.about.stats && data.about.stats.length) {
    renderAboutStats(data.about.stats);
  }

  const skillsHeadIcon = document.getElementById('skillsHeadIcon');
  if (skillsHeadIcon) skillsHeadIcon.innerHTML = ICONS.tools;
  if (data.skillCategories && data.skillCategories.length) {
    renderSkills(data.skillCategories, data.skillsIntro);
  }

  const projectsHeadIcon = document.getElementById('projectsHeadIcon');
  if (projectsHeadIcon) projectsHeadIcon.innerHTML = ICONS.rocket;
  if (data.projects && data.projects.length) {
    renderProjects(data.projects);
  }

  const githubHeadIcon = document.getElementById('githubHeadIcon');
  if (githubHeadIcon) githubHeadIcon.innerHTML = ICONS.github;
  if (data.github && data.github.username) {
    renderGithub(data.github);
  }

  const servicesHeadIcon = document.getElementById('servicesHeadIcon');
  if (servicesHeadIcon) servicesHeadIcon.innerHTML = ICONS.tools;
  if (data.services && data.services.length) {
    renderServices(data.services);
  }

  const langHeadIcon = document.getElementById('langHeadIcon');
  if (langHeadIcon) langHeadIcon.innerHTML = ICONS.globe;
  if (data.languages && data.languages.length) {
    renderLanguages(data.languages);
  }

  const valuesHeadIcon = document.getElementById('valuesHeadIcon');
  if (valuesHeadIcon) valuesHeadIcon.innerHTML = ICONS.shield;
  if (data.values && data.values.length) {
    renderValues(data.values);
  }

  const certHeadIcon = document.getElementById('certHeadIcon');
  if (certHeadIcon) certHeadIcon.innerHTML = ICONS.award;
  if (data.certificates && data.certificates.length) {
    renderCertificates(data.certificates);
  }

  const contactHeadIcon = document.getElementById('contactHeadIcon');
  if (contactHeadIcon) contactHeadIcon.innerHTML = ICONS.message;

  if (data.contact) {
    renderContact(data.contact);
  }

renderFooter(data);}

/* ============ TECH MARQUEE ============ */
function renderTechMarquee(items) {
  const track = document.getElementById('techMarqueeTrack');
  if (!track || !items || !items.length) return;

  function buildSet() {
    return items.map(item => {
      const wrap = el('div', { className: 'tm-item' });
      if (item.logo) {
        const img = document.createElement('img');
        img.src = item.logo;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = () => { img.style.display = 'none'; };
        wrap.appendChild(img);
      }
      wrap.appendChild(document.createTextNode(item.name));
      return wrap;
    });
  }

  // duplicate the set once so the -50% translateX loop is seamless
  buildSet().forEach(node => track.appendChild(node));
  buildSet().forEach(node => track.appendChild(node));
}

/* ============ ABOUT STATS (count-up) ============ */
function renderAboutStats(stats) {
  const wrap = document.getElementById('aboutStatsGrid');
  if (!wrap) return;
  wrap.innerHTML = '';

  stats.forEach(stat => {
    const numEl = el('div', { className: 'about-stat-num', text: '0' });
    const card = el('div', { className: 'about-stat glow-border always-glow' }, [
      cardTopbar(),
      numEl,
      el('div', { className: 'about-stat-label', text: stat.label })
    ]);
    card.dataset.target = stat.num;
    card.dataset.suffix = stat.suffix || '';
    wrap.appendChild(card);
  });

  observeAboutStatCounters();
}

function observeAboutStatCounters() {
  const cards = document.querySelectorAll('#aboutStatsGrid .about-stat');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(animateStatCount);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStatCount(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  cards.forEach(card => io.observe(card));
}

function animateStatCount(card) {
  const numEl = card.querySelector('.about-stat-num');
  const target = parseFloat(card.dataset.target) || 0;
  const suffix = card.dataset.suffix || '';
  const duration = 900;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target % 1 === 0 ? Math.round(target * eased) : (target * eased).toFixed(1);
    numEl.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      numEl.textContent = target + suffix;
    }
  }
  requestAnimationFrame(tick);
}

/* ============ PROJECTS ============ */
function renderProjects(projects) {
  const wrap = document.getElementById('projectsList');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.classList.remove('generic-grid');
  wrap.classList.add('skills-grid');
  projects.forEach(proj => wrap.appendChild(buildProjectCard(proj)));
}

function buildProjectCard(proj) {
  const card = el('div', { className: 'skill-card proj-card glow-border' });

  card.appendChild(cardTopbar());

  const icon = el('div', { className: 'skc-icon' });
  icon.innerHTML = ICONS.code;

  const head = el('div', { className: 'skc-head' }, [
    icon,
    el('div', {}, [
      el('div', { className: 'skc-title', text: proj.title }),
      el('div', { className: 'skc-desc', text: proj.description || '' })
    ])
  ]);
  card.appendChild(head);

  const btnRow = el('div', { className: 'proj-btn-row' });

  if (proj.github) {
    const ghBtn = el('a', { className: 'skc-detail-btn glow-border always-glow', href: proj.github, target: '_blank', rel: 'noopener' });
    ghBtn.innerHTML = ICONS.github + '<span>GitHub</span>';
    btnRow.appendChild(ghBtn);
  }
  if (proj.live) {
    const liveBtn = el('a', { className: 'skc-detail-btn glow-border always-glow', href: proj.live, target: '_blank', rel: 'noopener' });
    liveBtn.innerHTML = ICONS.rocket + '<span>Live Site</span>';
    btnRow.appendChild(liveBtn);
  }

  card.appendChild(btnRow);
  return card;
}

/* ============ GITHUB ACTIVITY ============ */
function renderGithub(gh) {
  const subEl = document.getElementById('githubSubheading');
  if (subEl) subEl.textContent = gh.subheading || '';

  const statsGrid = document.getElementById('githubStatsGrid');
  const statDefs = [
    { key: 'publicRepos', label: 'Public Repos', icon: 'code' },
    { key: 'followers', label: 'Followers', icon: 'users' },
    { key: 'totalStars', label: 'Total Stars', icon: 'spark' },
    { key: 'topLanguage', label: 'Top Language', icon: 'code' }
  ];

  const numEls = {};
  if (statsGrid) {
    statsGrid.innerHTML = '';
    statDefs.forEach(sd => {
      const icon = el('div', { className: 'gh-stat-icon' });
      icon.innerHTML = ICONS[sd.icon] || ICONS.spark;
      const numEl = el('div', { className: 'gh-stat-num', text: '—' });
      const card = el('div', { className: 'gh-stat-card glow-border' }, [
        cardTopbar(),
        icon,
        numEl,
        el('div', { className: 'gh-stat-label', text: sd.label })
      ]);
      statsGrid.appendChild(card);
      numEls[sd.key] = numEl;
    });
  }

  const profileBtn = document.getElementById('githubProfileBtn');
  if (profileBtn) {
    profileBtn.href = `https://github.com/${gh.username}`;
    profileBtn.innerHTML = ICONS.github + '<span>View Full GitHub Profile</span>';
  }

  const liveNote = document.getElementById('githubLiveNote');
  if (liveNote) liveNote.textContent = `Live data for github.com/${gh.username}`;

  loadGithubContribImage(gh.username);
  fetchGithubStats(gh.username, numEls);
}

async function fetchGithubStats(username, numEls) {
  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (userRes.ok) {
      const user = await userRes.json();
      if (numEls.publicRepos) numEls.publicRepos.textContent = user.public_repos ?? '—';
      if (numEls.followers) numEls.followers.textContent = user.followers ?? '—';
    }

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        let totalStars = 0;
        const langCount = {};
        repos.forEach(r => {
          totalStars += r.stargazers_count || 0;
          if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
        });
        if (numEls.totalStars) numEls.totalStars.textContent = totalStars;
        const topLang = Object.keys(langCount).sort((a, b) => langCount[b] - langCount[a])[0];
        if (numEls.topLanguage) numEls.topLanguage.textContent = topLang || '—';
      }
    }
  } catch (err) {
    console.error('GitHub stats failed to load:', err);
  }
}

function loadGithubContribImage(username) {
  const img = document.getElementById('githubContribImg');
  if (!img) return;
  const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const accent = accentRaw.replace('#', '') || '2dd4bf';
  img.dataset.username = username;
  img.onerror = () => { img.style.display = 'none'; };
  img.onload = () => { img.style.display = 'block'; };
  img.src = `https://ghchart.rshah.org/${accent}/${username}`;
}

/* ============ SERVICES ============ */
function renderServices(services) {
  const wrap = document.getElementById('servicesList');
  if (!wrap) return;
  wrap.innerHTML = '';
  services.forEach(s => {
    const icon = el('div', { className: 'value-icon service-icon' });
    icon.innerHTML = ICONS[s.icon] || ICONS.spark;
    const card = el('div', { className: 'value-card service-card glow-border' }, [
      cardTopbar(),
      icon,
      el('div', { className: 'value-title', text: s.title }),
      el('div', { className: 'value-desc', text: s.description })
    ]);
    wrap.appendChild(card);
  });
}

/* ============ CONTACT ============ */
function renderContact(contact) {
  document.getElementById('contactInfoIcon').innerHTML = ICONS.users;
  document.getElementById('contactSocialIcon').innerHTML = ICONS.globe;
  document.getElementById('contactFormIcon').innerHTML = ICONS.send;

  document.getElementById('contactSub').textContent = contact.subheading || '';

  if (contact.info && contact.info.length) {
    const infoWrap = document.getElementById('contactInfoList');
    contact.info.forEach(item => {
      const row = el(item.href ? 'a' : 'div', { className: 'contact-info-row' });
      if (item.href) {
        row.href = item.href;
        if (item.href.startsWith('http')) { row.target = '_blank'; row.rel = 'noopener'; }
      }
      const icon = el('div', { className: 'cir-icon' });
      icon.innerHTML = ICONS[item.icon] || ICONS.pin;
      row.appendChild(icon);
      row.appendChild(el('div', {}, [
        el('div', { className: 'cir-label', text: item.label }),
        el('div', { className: 'cir-value', text: item.value })
      ]));
      infoWrap.appendChild(row);
    });
  }

  if (contact.social && contact.social.length) {
    const socialWrap = document.getElementById('contactSocialList');
    contact.social.forEach(item => {
      const card = el('a', { className: 'social-card glow-border', href: item.href, target: '_blank', rel: 'noopener' });
      card.appendChild(cardTopbar());
      const iconWrap = document.createElement('span');
      iconWrap.innerHTML = ICONS[item.icon] || ICONS.globe;
      card.appendChild(iconWrap);
      card.appendChild(el('div', { className: 'social-card-label', text: item.label }));
      card.appendChild(el('div', { className: 'social-card-sub', text: item.sub || '' }));
      socialWrap.appendChild(card);
    });
  }

  document.getElementById('cfSubmitIcon').innerHTML = ICONS.send;

  const form = document.getElementById('contactForm');
  const toEmail = (contact.info || []).find(i => i.icon === 'mail');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cfName').value.trim();
    const emailAddr = document.getElementById('cfEmail').value.trim();
    const subject = document.getElementById('cfSubject').value.trim() || 'Portfolio Contact';
    const message = document.getElementById('cfMessage').value.trim();
    const body = `Name: ${name}\nEmail: ${emailAddr}\n\n${message}`;
    const target = toEmail ? toEmail.value : '';
    window.location.href = `mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  document.getElementById('contactCtaTitle').textContent = contact.ctaTitle || '';
  document.getElementById('contactCtaText').textContent = contact.ctaText || '';
  if (contact.ctaButtons && contact.ctaButtons.length) {
    const ctaBtnWrap = document.getElementById('contactCtaButtons');
    contact.ctaButtons.forEach((btn, i) => {
      const a = el('a', { className: 'cta-btn glow-border ' + (i === 0 ? 'cta-primary' : 'cta-secondary'), href: btn.href });
      a.innerHTML = ICONS[btn.icon] || '';
      a.appendChild(el('span', { text: btn.label }));
      ctaBtnWrap.appendChild(a);
    });
  }

  document.querySelectorAll('.contact-card').forEach(card => {
    if (!card.querySelector(':scope > .card-topbar')) {
      card.insertBefore(cardTopbar(), card.firstChild);
    }
  });
}

/* ============ SKILLS (categorized + filterable) ============ */
function renderSkills(categories, intro) {
  const introEl = document.getElementById('skillsIntro');
  if (intro) introEl.textContent = intro;

  const filterWrap = document.getElementById('skillsFilter');
  const gridWrap = document.getElementById('skillsGrid');

  const filters = [{ id: 'all', label: 'All Skills' }].concat(
    categories.map(cat => ({ id: cat.id, label: cat.title }))
  );

  filters.forEach((f, i) => {
    const isActive = i === 0;
    const btn = el('button', { className: 'skf-btn glow-border' + (isActive ? ' active always-glow' : '') });
    btn.appendChild(el('span', { text: f.label }));
    btn.dataset.filter = f.id;
    btn.addEventListener('click', () => {
      filterWrap.querySelectorAll('.skf-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.remove('always-glow');
      });
      btn.classList.add('active');
      btn.classList.add('always-glow');
      applySkillFilter(f.id);
    });
    filterWrap.appendChild(btn);
  });

  categories.forEach(cat => {
    const card = el('div', { className: 'skill-card glow-border' });
    card.dataset.category = cat.id;

    card.appendChild(cardTopbar());

    const icon = el('div', { className: 'skc-icon' });
    icon.innerHTML = ICONS[cat.icon] || ICONS.code;

    const head = el('div', { className: 'skc-head' }, [
      icon,
      el('div', {}, [
        el('div', { className: 'skc-title', text: cat.title }),
        el('div', { className: 'skc-desc', text: cat.description })
      ])
    ]);
    card.appendChild(head);

    const pillsWrap = el('div', { className: 'skc-pills' });
    cat.items.forEach(item => {
      const pill = el('div', { className: 'skc-pill' });
      if (item.logo) {
        const logo = document.createElement('img');
        logo.src = item.logo;
        logo.alt = item.name;
        logo.className = 'skc-pill-logo';
        logo.onerror = () => { logo.style.display = 'none'; };
        pill.appendChild(logo);
      } else {
        pill.appendChild(el('span', { className: 'skc-pill-icon' }));
      }
      pill.appendChild(el('span', { text: item.name }));
      pillsWrap.appendChild(pill);
    });
    card.appendChild(pillsWrap);

    const detailBtn = el('button', { className: 'skc-detail-btn glow-border always-glow' });
    detailBtn.innerHTML = ICONS.eye + '<span>Detail View</span>';
    detailBtn.addEventListener('click', () => openSkillModal(cat));
    card.appendChild(detailBtn);

    gridWrap.appendChild(card);
  });
}

/* ============ SKILL DETAIL MODAL ============ */
function openSkillModal(cat) {
  const modal = document.getElementById('skillModal');
  const iconEl = document.getElementById('skillModalIcon');
  const titleEl = document.getElementById('skillModalTitle');
  const descEl = document.getElementById('skillModalDesc');
  const rowsWrap = document.getElementById('skillModalRows');

  iconEl.innerHTML = ICONS[cat.icon] || ICONS.code;
  titleEl.textContent = cat.title;
  descEl.textContent = cat.description;

  rowsWrap.innerHTML = '';
  const fills = [];
  cat.items.forEach(item => {
    const row = el('div', { className: 'skill-row' });

    const left = el('div', { className: 'skr-left' });
    if (item.logo) {
      const logo = document.createElement('img');
      logo.src = item.logo;
      logo.alt = item.name;
      logo.className = 'skr-logo';
      logo.onerror = () => { logo.style.display = 'none'; };
      left.appendChild(logo);
    } else {
      left.appendChild(el('div', { className: 'skr-logo-fallback' }));
    }
    left.appendChild(el('span', { className: 'skr-name', text: item.name }));

    const rightSide = el('div', { className: 'skr-right' });
    if (item.tag) rightSide.appendChild(el('span', { className: 'skr-tag', text: item.tag }));
    rightSide.appendChild(el('span', { className: 'skr-pct', text: (item.percent || 0) + '%' }));

    const top = el('div', { className: 'skr-top' }, [left, rightSide]);

    const barOuter = el('div', { className: 'skr-bar' });
    const barFill = el('div', { className: 'skr-bar-fill' });
    barOuter.appendChild(barFill);

    row.appendChild(top);
    row.appendChild(barOuter);
    rowsWrap.appendChild(row);

    fills.push({ node: barFill, percent: item.percent || 0 });
  });

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const scrollWrap = modal.querySelector('.skill-modal-scroll');
  if (scrollWrap) scrollWrap.scrollTop = 0;

  fills.forEach(f => { f.node.style.width = '0%'; });
  void rowsWrap.offsetWidth;
  setTimeout(() => {
    fills.forEach(f => { f.node.style.width = f.percent + '%'; });
  }, 60);
}

function closeSkillModal() {
  const modal = document.getElementById('skillModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('skillModalBackdrop');
  const closeBtn = document.getElementById('skillModalClose');
  if (backdrop) backdrop.addEventListener('click', closeSkillModal);
  if (closeBtn) closeBtn.addEventListener('click', closeSkillModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSkillModal();
  });
});

function applySkillFilter(filterId) {
  const cards = document.querySelectorAll('#skillsGrid .skill-card');
  cards.forEach(card => {
    const show = filterId === 'all' || card.dataset.category === filterId;
    card.style.display = show ? '' : 'none';
  });
}

/* ============ LANGUAGES ============ */
function renderLanguages(languages) {
  const wrap = document.getElementById('languagesList');
  languages.forEach(lang => {
    const card = el('div', { className: 'lang-card glow-border' });

    card.appendChild(cardTopbar());

    const top = el('div', { className: 'lang-top' }, [
      el('span', { className: 'lang-flag', text: lang.flag || '' }),
      el('div', {}, [
        el('div', { className: 'lang-name', text: lang.name }),
        el('div', { className: 'lang-level', text: lang.level })
      ])
    ]);

    const barOuter = el('div', { className: 'lang-bar' });
    const barFill = el('div', { className: 'lang-bar-fill' });
    barOuter.appendChild(barFill);

    const pctLabel = el('div', { className: 'lang-pct', text: (lang.percent || 0) + '%' });

    card.appendChild(top);
    card.appendChild(barOuter);
    card.appendChild(pctLabel);
    wrap.appendChild(card);

    requestAnimationFrame(() => {
      setTimeout(() => { barFill.style.width = (lang.percent || 0) + '%'; }, 100);
    });
  });
}

/* ============ VALUES ============ */
function renderValues(values) {
  const wrap = document.getElementById('valuesList');
  values.forEach(val => {
    const icon = el('div', { className: 'value-icon' });
    icon.innerHTML = ICONS[val.icon] || ICONS.spark;

    const card = el('div', { className: 'value-card glow-border' }, [
      cardTopbar(),
      icon,
      el('div', { className: 'value-title', text: val.title }),
      el('div', { className: 'value-desc', text: val.description })
    ]);
    wrap.appendChild(card);
  });
}

/* ============ CERTIFICATES (carousel) ============ */
function renderCertificates(certificates) {
  const track = document.getElementById('certTrack');
  const dotsWrap = document.getElementById('certDots');
  const prevBtn = document.getElementById('certPrev');
  const nextBtn = document.getElementById('certNext');

  const perPage = 6;
  const pages = [];
  for (let i = 0; i < certificates.length; i += perPage) {
    pages.push(certificates.slice(i, i + perPage));
  }

  let current = 0;

  pages.forEach(pageCerts => {
    const page = el('div', { className: 'cert-page' });
    pageCerts.forEach(cert => page.appendChild(buildCertCard(cert)));
    track.appendChild(page);
  });

  pages.forEach((_, i) => {
    const dot = el('div', { className: 'cert-dot' + (i === 0 ? ' active' : '') });
    dot.addEventListener('click', () => goToPage(i));
    dotsWrap.appendChild(dot);
  });

  function goToPage(index) {
    current = Math.max(0, Math.min(index, pages.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap.querySelectorAll('.cert-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages.length - 1;
  }

  prevBtn.addEventListener('click', () => goToPage(current - 1));
  nextBtn.addEventListener('click', () => goToPage(current + 1));

  if (pages.length <= 1) {
    document.querySelector('.cert-nav').style.display = 'none';
  }

  goToPage(0);
}

function buildCertCard(cert) {
  const thumb = el('div', { className: 'cert-thumb' });
  const img = document.createElement('img');
  img.src = cert.image;
  img.alt = cert.title;
  img.loading = 'lazy';
  img.onerror = () => {
    img.remove();
    const fb = el('div', { className: 'cert-thumb-fallback' });
    const iconWrap = document.createElement('div');
    iconWrap.className = 'cert-thumb-icon';
    iconWrap.innerHTML = ICONS.eye;
    fb.appendChild(iconWrap);
    fb.appendChild(document.createTextNode('Image not added yet'));
    thumb.appendChild(fb);
  };
  thumb.appendChild(img);

  const info = el('div', { className: 'cert-info' }, [
    el('div', { className: 'cert-title', text: cert.title }),
    el('div', { className: 'cert-issuer', text: [cert.issuer, cert.date].filter(Boolean).join(' \u00b7 ') })
  ]);

  const detailBtn = el('button', { className: 'skc-detail-btn glow-border always-glow' });
  detailBtn.innerHTML = ICONS.eye + '<span>Detail View</span>';
  detailBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCertDetailModal(cert);
  });
  info.appendChild(detailBtn);

  const card = el('div', { className: 'cert-card glow-border' }, [cardTopbar(), thumb, info]);
  card.addEventListener('click', () => openCertModal(cert.image));
  return card;
}

/* ============ CERTIFICATE DETAIL MODAL ============ */
function openCertDetailModal(cert) {
  const modal = document.getElementById('certDetailModal');
  const iconEl = document.getElementById('certDetailIcon');
  const titleEl = document.getElementById('certDetailTitle');
  const descEl = document.getElementById('certDetailDesc');
  const rowsWrap = document.getElementById('certDetailRows');

  iconEl.innerHTML = ICONS.award;
  titleEl.textContent = cert.title || '';
  descEl.textContent = cert.issuer || '';

  rowsWrap.innerHTML = '';
  const fields = [
    { label: 'Issuer Name', value: cert.issuer },
    { label: 'Certificate Name', value: cert.title },
    { label: 'Certificate ID', value: cert.certificateId },
    { label: 'Date', value: cert.date }
  ];
  fields.forEach(f => {
    if (!f.value) return;
    rowsWrap.appendChild(el('div', {}, [
      el('div', { className: 'about-info-label', text: f.label }),
      el('div', { className: 'about-info-value', text: f.value })
    ]));
  });

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const scrollWrap = modal.querySelector('.skill-modal-scroll');
  if (scrollWrap) scrollWrap.scrollTop = 0;
}

function closeCertDetailModal() {
  const modal = document.getElementById('certDetailModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('certDetailBackdrop');
  const closeBtn = document.getElementById('certDetailClose');
  if (backdrop) backdrop.addEventListener('click', closeCertDetailModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCertDetailModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCertDetailModal();
  });
});

/* ============ EDUCATION CARDS ============ */
function buildEduCard(edu) {
  const card = el('div', { className: 'edu-card glow-border' });

  card.appendChild(cardTopbar());

  const badge = el('span', { className: 'edu-badge', text: edu.level });
  const headRow = el('div', { className: 'edu-head-row' });
  const icon = el('div', { className: 'edu-icon' });
  icon.innerHTML = ICONS.gradcap;
  headRow.appendChild(icon);
  if (edu.logo) {
    const logo = document.createElement('img');
    logo.src = edu.logo;
    logo.alt = edu.institution + ' logo';
    logo.className = 'edu-logo';
    headRow.appendChild(logo);
  }
  headRow.appendChild(el('h4', { className: 'edu-inst', text: edu.institution }));
  const session = el('div', { className: 'edu-session', text: edu.session });

  const stat = el('div', { className: 'edu-gpa' }, [
    el('span', { className: 'edu-gpa-num', text: edu.gpa }),
    el('span', { className: 'edu-gpa-label', text: 'GPA' })
  ]);

  const certBtn = el('button', { className: 'edu-cert-btn glow-border always-glow' });
  certBtn.innerHTML = ICONS.eye + '<span>View Certificate</span>';
  certBtn.addEventListener('click', () => openCertModal(edu.certificate));

  const top = el('div', { className: 'edu-top' }, [badge, stat]);
  card.appendChild(top);
  card.appendChild(headRow);
  card.appendChild(session);
  card.appendChild(certBtn);
  return card;
}

function buildUniversityCard(edu) {
  const card = el('div', { className: 'edu-card edu-card-university glow-border' });

  card.appendChild(cardTopbar());

  const badge = el('span', { className: 'edu-badge', text: edu.level });
  const headRow = el('div', { className: 'edu-head-row' });
  const uIcon = el('div', { className: 'edu-icon' });
  uIcon.innerHTML = ICONS.gradcap;
  headRow.appendChild(uIcon);
  if (edu.logo) {
    const logo = document.createElement('img');
    logo.src = edu.logo;
    logo.alt = edu.institution + ' logo';
    logo.className = 'edu-logo';
    headRow.appendChild(logo);
  }
  headRow.appendChild(el('h4', { className: 'edu-inst', text: edu.institution }));
  const session = el('div', { className: 'edu-session', text: edu.session });

  const cgpaBox = el('div', { className: 'edu-gpa' }, [
    el('span', { className: 'edu-gpa-num', text: '0.00' }),
    el('span', { className: 'edu-gpa-label', text: 'CGPA' })
  ]);
  const cgpaNum = cgpaBox.querySelector('.edu-gpa-num');

  const top = el('div', { className: 'edu-top' }, [badge, cgpaBox]);
  card.appendChild(top);
  card.appendChild(headRow);
  card.appendChild(session);

  let saved = null;
  try {
    const raw = localStorage.getItem('semesterGPAs');
    if (raw) saved = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  const values = [];
  for (let i = 0; i < edu.totalSemesters; i++) {
    if (saved && saved[i] !== undefined && saved[i] !== null) {
      values.push(saved[i]);
    } else if (edu.semesterGPAs && edu.semesterGPAs[i] !== undefined) {
      values.push(edu.semesterGPAs[i]);
    } else {
      values.push(null);
    }
  }

  function recalc() {
    const filled = values.filter(v => v !== null && v !== '' && !isNaN(v));
    const avg = filled.length ? filled.reduce((a, b) => a + Number(b), 0) / filled.length : 0;
    cgpaNum.textContent = avg.toFixed(2);
    try { localStorage.setItem('semesterGPAs', JSON.stringify(values)); } catch (e) { /* ignore */ }
  }

  const semGrid = el('div', { className: 'sem-grid' });
  for (let i = 0; i < edu.totalSemesters; i++) {
    const cell = el('div', { className: 'sem-cell' });
    const label = el('label', { className: 'sem-label', text: 'Sem ' + (i + 1) });
    const inputWrap = el('div', { className: 'sem-input-wrap glow-border always-glow' });
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '4';
    input.step = '0.01';
    input.className = 'sem-input';
    input.placeholder = '—';
    if (values[i] !== null) input.value = values[i];
    input.addEventListener('input', () => {
      const v = input.value.trim();
      values[i] = v === '' ? null : parseFloat(v);
      recalc();
    });
    inputWrap.appendChild(input);
    cell.appendChild(label);
    cell.appendChild(inputWrap);
    semGrid.appendChild(cell);
  }
  card.appendChild(semGrid);
  card.appendChild(el('p', { className: 'sem-hint', text: 'Enter each completed semester\u2019s GPA — CGPA updates automatically.' }));

  recalc();
  return card;
}

/* ============ CERTIFICATE LIGHTBOX ============ */
function openCertModal(src) {
  const modal = document.getElementById('certModal');
  const img = document.getElementById('certImage');
  const fallback = document.getElementById('certFallback');

  img.style.display = 'none';
  fallback.style.display = 'none';

  if (src) {
    img.onload = () => { img.style.display = 'block'; };
    img.onerror = () => { fallback.style.display = 'block'; };
    img.src = src;
  } else {
    fallback.style.display = 'block';
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCertModal() {
  const modal = document.getElementById('certModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('certBackdrop');
  const closeBtn = document.getElementById('certClose');
  if (backdrop) backdrop.addEventListener('click', closeCertModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCertModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCertModal();
  });
});

/* ============ ICONS ============ */
const ICONS = {
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>',
  tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-2.5-2.5a1.5 1.5 0 0 1 0-2.12l4.38-4.38a1.5 1.5 0 0 1 2.12 0L21 14"/><path d="M13 19l1.5 1.5a1.5 1.5 0 0 0 2.12 0l4.38-4.38"/><path d="M8.5 14.5L3 9l3-3 5 5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 19 3c0 2.5-.5 6.5-3 9a22 22 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.77 10.79.57.1.78-.25.78-.55v-2.13c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.29.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.31-5.19 5.59.41.35.77 1.04.77 2.1v3.11c0 .3.21.66.79.55 4.5-1.51 7.76-5.77 7.76-10.79C23.02 5.24 18.27.5 12 .5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.834-.012c-.531 0-1.008.062-1.407.223a1.858 1.858 0 0 0-.918.706c-.201.335-.317.842-.317 1.6v1.454h3.919l-.552 3.667h-3.367v7.98H9.101z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
  beecrowd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="12" cy="12" r="2.4"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  gradcap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 10v6"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>'
};

/* ============ TYPEWRITER EFFECT ============ */
function startTypewriter(roles) {
  const target = document.getElementById('typewriterText');
  if (!roles || !roles.length) return;
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      target.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
      setTimeout(tick, 70);
    } else {
      charIndex--;
      target.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, 35);
    }
  }
  tick();
}

/* ============ ANIMATED NAME (left to right, one letter at a time) ============ */
async function animateBrandName(name) {
  const wrap = document.getElementById('brandName');
  wrap.innerHTML = '';
  const chars = name.split('');
  chars.forEach(ch => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = ch;
    wrap.appendChild(span);
  });

  if (preloaderDone) await preloaderDone;

  const spans = wrap.querySelectorAll('.ch');
  spans.forEach((span, i) => {
    setTimeout(() => span.classList.add('in'), i * 110);
  });
}

/* ============ THEME SWITCHER ============ */
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbTriplet(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function applyTheme(theme) {
  const root = document.documentElement.style;
  root.setProperty('--bg', theme.bg);
  root.setProperty('--bg-rgb', hexToRgbTriplet(theme.bg));
  root.setProperty('--bg-alt', theme.bgAlt);
  root.setProperty('--ink', theme.ink);
  root.setProperty('--accent', theme.accent);
  root.setProperty('--accent2', theme.accent2 || theme.accent);
  root.setProperty('--accent3', theme.accent3 || theme.accent);
  root.setProperty('--ink-dim', hexToRgba(theme.ink, 0.65));
  root.setProperty('--ink-dimmer', hexToRgba(theme.ink, 0.4));
  root.setProperty('--line', hexToRgba(theme.ink, 0.32));
  root.setProperty('--grid-line', hexToRgba(theme.ink, 0.06));
  root.setProperty('--grid-line-strong', hexToRgba(theme.ink, 0.11));
  root.setProperty('--accent-dim', hexToRgba(theme.accent, 0.16));
  try { localStorage.setItem('portfolioTheme', theme.name); } catch (e) { /* ignore */ }

  const contribImg = document.getElementById('githubContribImg');
  if (contribImg && contribImg.dataset.username) {
    contribImg.src = `https://ghchart.rshah.org/${theme.accent.replace('#', '')}/${contribImg.dataset.username}`;
  }
}

function setupThemes(themes) {
  const panel = document.getElementById('themePanel');
  const toggle = document.getElementById('themeToggle');

  themes.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'theme-opt';
    const swatch = document.createElement('span');
    swatch.className = 'theme-swatch';
    swatch.style.background = theme.accent;
    btn.appendChild(swatch);
    btn.appendChild(document.createTextNode(theme.name));
    btn.addEventListener('click', () => applyTheme(theme));
    panel.appendChild(btn);
  });

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  let saved = null;
  try { saved = localStorage.getItem('portfolioTheme'); } catch (e) { /* ignore */ }
  const initial = themes.find(t => t.name === saved) || themes[0];
  applyTheme(initial);
}


/* ============ FOOTER ============ */
const FOOTER_NAV_ICONS = {
  'Home': 'spark', 'About': 'users', 'Education': 'gradcap', 'Skills': 'tools',
  'Projects': 'rocket', 'GitHub': 'github', 'Services': 'compass',
  'Certificates': 'award', 'Languages': 'globe', 'Values': 'shield', 'Contact': 'message'
};

function renderFooter(data) {
  const nameEl = document.getElementById('footerBrandName');
  if (nameEl) nameEl.textContent = data.meta.name;

  const taglineEl = document.getElementById('footerBrandTagline');
  if (taglineEl) {
    taglineEl.textContent = 'Software Engineering student building with AI as a development partner — one diagram, one commit at a time.';
  }

  const socialWrap = document.getElementById('footerSocial');
  if (socialWrap && data.contact && data.contact.social) {
    data.contact.social.forEach(item => {
      const a = el('a', { className: 'footer-social-link', href: item.href, target: '_blank', rel: 'noopener' });
      a.innerHTML = ICONS[item.icon] || ICONS.globe;
      a.setAttribute('aria-label', item.label);
      socialWrap.appendChild(a);
    });
  }

  const navWrap = document.getElementById('footerNavLinks');
  if (navWrap && data.nav) {
    data.nav.forEach(item => {
      const iconKey = FOOTER_NAV_ICONS[item.label] || 'spark';
      const iconSpan = el('span', { className: 'footer-link-icon' });
      iconSpan.innerHTML = ICONS[iconKey] || '';
      const a = el('a', { href: item.href }, [iconSpan, el('span', { text: item.label })]);
      navWrap.appendChild(el('li', {}, [a]));
    });
  }

  const contactWrap = document.getElementById('footerContactLinks');
  if (contactWrap && data.contact && data.contact.info) {
    data.contact.info.forEach(item => {
      const iconSpan = el('span', { className: 'footer-link-icon' });
      iconSpan.innerHTML = ICONS[item.icon] || ICONS.pin;
      if (item.href) {
        const a = el('a', { href: item.href }, [iconSpan, el('span', { text: item.value })]);
        contactWrap.appendChild(el('li', {}, [a]));
      } else {
        contactWrap.appendChild(el('li', {}, [iconSpan, el('span', { text: item.value })]));
      }
    });
  }

  const copyrightEl = document.getElementById('footerCopyright');
  if (copyrightEl) copyrightEl.textContent = data.footer;
}


/* ============ MOBILE HAMBURGER MENU ============ */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
  });

  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  });
});

/* ============ CUSTOM GLOW CURSOR ============ */
(function initGlowCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  window.addEventListener('mousedown', () => {
    ring.classList.add('click');
    dot.classList.add('click');
  });
  window.addEventListener('mouseup', () => {
    ring.classList.remove('click');
    dot.classList.remove('click');
  });

  const hoverTargets = 'a, button, .cta-btn, .skf-btn, .cert-card, .skill-card, .value-card, .lang-card, .about-stat, input, textarea, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('hover');
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();