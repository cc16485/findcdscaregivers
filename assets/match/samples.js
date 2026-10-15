// Illustrative caregiver cards for the PUBLIC page. Made-up people, drawn
// AI-generated photos of people who don't exist (made 2026-10-15), labeled
// "Sample profile". Never real caregivers or real data.
function face({ skin, hair, style, top, bg }) {
  const H = {
    bob: `<path d="M30 46c0-16 9-24 20-24s20 8 20 24v14c-3 2-6 2-8 0V44c-4-4-20-4-24 0v16c-2 2-5 2-8 0z" fill="${hair}"/>`,
    short: `<path d="M32 44c0-14 8-21 18-21s18 7 18 21c-4-6-10-8-18-8s-14 2-18 8z" fill="${hair}"/>`,
    curly: `<g fill="${hair}"><circle cx="36" cy="38" r="9"/><circle cx="48" cy="30" r="10"/><circle cx="62" cy="34" r="9"/><circle cx="67" cy="46" r="7"/><circle cx="33" cy="49" r="7"/></g>`,
    bun: `<g fill="${hair}"><circle cx="50" cy="20" r="8"/><path d="M32 46c0-14 8-21 18-21s18 7 18 21c-4-6-10-8-18-8s-14 2-18 8z"/></g>`,
  };
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration"><rect width="100" height="100" fill="${bg}"/>` +
    `<path d="M14 100c2-20 17-30 36-30s34 10 36 30z" fill="${top}"/><path d="M42 62h16v12c-4 4-12 4-16 0z" fill="${skin}"/>` +
    `<ellipse cx="50" cy="47" rx="17" ry="19" fill="${skin}"/>${H[style]}` +
    `<circle cx="44" cy="49" r="1.8" fill="#16283a"/><circle cx="56" cy="49" r="1.8" fill="#16283a"/>` +
    `<path d="M44 57q6 5 12 0" stroke="#16283a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
}
export const SAMPLES = [
  { name: 'Grace', photo: 'assets/samples/sample-grace.jpg', town: 'Near Ozark', when: 'Weekday mornings', hours: '15 to 25 hours a week', video: true,
    quote: 'I cared for my grandmother for three years. I\'m patient and I always show up.', svg: face({ skin: '#e8b98f', hair: '#6b3f1f', style: 'bob', top: '#2f8b86', bg: '#e9f6f5' }) },
  { name: 'Andre', photo: 'assets/samples/sample-andre.jpg', town: 'Near Springfield', when: 'Evenings and weekends', hours: '10 to 20 hours a week', video: true,
    quote: 'Steady with transfers, good company, and happy to run errands.', svg: face({ skin: '#8d5a3b', hair: '#120c08', style: 'short', top: '#0e3860', bg: '#fdf3e1' }) },
  { name: 'Rosa', photo: 'assets/samples/sample-rosa.jpg', town: 'Near Republic', when: 'Mon, Wed, Fri days', hours: '20 to 30 hours a week', video: false,
    quote: 'Bilingual and organized. I like a calm, well-kept home.', svg: face({ skin: '#c98d5e', hair: '#1d1410', style: 'curly', top: '#c17a12', bg: '#f2f0e9' }) },
];
