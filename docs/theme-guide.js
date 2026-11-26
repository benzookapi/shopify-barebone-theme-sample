const reader = document.querySelector('.reader');
const lessons = [...reader.querySelectorAll('.lesson')];
const lessonLinks = document.querySelectorAll('.syllabus a');
const languageLinks = document.querySelectorAll('.languages a');
const languagePaths = [...languageLinks].map(link => link.getAttribute('href'));

function showLocation(moveFocus = false) {
  const hash = window.location.hash;
  const target = document.getElementById(hash.slice(1));
  const selected = lessons.includes(target) ? target : null;
  const current = selected || lessons.find(lesson => !lesson.hidden) || lessons[0];

  for (const lesson of lessons) {
    lesson.hidden = lesson !== current;
  }
  for (const link of lessonLinks) {
    if (link.hash === '#' + current.id) {
      link.setAttribute('aria-current', 'step');
    } else {
      link.removeAttribute('aria-current');
    }
  }
  languageLinks.forEach((link, index) => {
    link.setAttribute('href', languagePaths[index] + hash);
  });

  if (target instanceof HTMLDetailsElement) target.open = true;
  if (selected || target instanceof HTMLDetailsElement) {
    target.scrollIntoView({ block: 'start' });
    if (moveFocus) {
      const heading = selected ? selected.querySelector('h2') : target.querySelector('summary');
      heading.focus({ preventScroll: true });
    }
  }
}

reader.dataset.enhanced = '';
showLocation();
window.addEventListener('hashchange', () => showLocation(true));

const swap = document.querySelector('.swap');
const orderIds = document.querySelectorAll('[data-order-id]');
const orderList = document.querySelector('.order-list');
const orderStatus = document.querySelector('[data-order-status]');

swap.hidden = false;
swap.addEventListener('click', () => {
  const firstId = orderIds[0].textContent;
  orderIds[0].textContent = orderIds[1].textContent;
  orderIds[1].textContent = firstId;
  orderList.append(orderList.firstElementChild);
  orderStatus.textContent = [...orderList.children].map(item => item.textContent).join(' → ');
});
