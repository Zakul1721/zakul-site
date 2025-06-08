
  // ===== ГАЛЕРЕЯ ЗОБРАЖЕНЬ =====
  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.querySelectorAll('.thumbnails img');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      mainImage.src = thumb.src;
      thumbnails.forEach(img => img.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // ===== API НОВОЇ ПОШТИ =====
  const API_KEY = 'b1bcd55fc802f184b56d655a959b4d1b';

  const cityInput = document.getElementById('city');
  const warehouseSelect = document.getElementById('warehouse');
  const orderForm = document.getElementById('order-form');
  const commentsList = document.getElementById('comments-list');
  const commentForm = document.getElementById('comment-form');
  const messageBox = document.getElementById('message');
  const starsContainer = document.getElementById('star-rating');
  const ratingInput = document.getElementById('rating-value');
  const stars = starsContainer.querySelectorAll('span');
  const avgRatingContainer = document.getElementById('average-rating');

  const cityCache = new Map();

  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedCitySearch = debounce(async function () {
    const city = this.value.trim();

    if (city.length < 3) {
      warehouseSelect.innerHTML = '<option disabled selected>Оберіть відділення</option>';
      return;
    }

    warehouseSelect.innerHTML = '<option disabled selected>Завантаження...</option>';

    if (cityCache.has(city)) {
      fetchWarehouses(cityCache.get(city));
      return;
    }

    try {
      const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: 'AddressGeneral',
          calledMethod: 'getCities',
          methodProperties: { FindByString: city }
        })
      });

      const data = await res.json();

      if (data.success && data.data.length > 0) {
        const ref = data.data[0].Ref;
        cityCache.set(city, ref);
        fetchWarehouses(ref);
      } else {
        warehouseSelect.innerHTML = '<option disabled selected>Відділення не знайдені</option>';
      }
    } catch (err) {
      console.error('City fetch error:', err);
      warehouseSelect.innerHTML = '<option disabled selected>Помилка завантаження</option>';
    }
  }, 400);

  cityInput.addEventListener('input', debouncedCitySearch);

  async function fetchWarehouses(ref) {
    warehouseSelect.innerHTML = '<option disabled selected>Завантаження...</option>';

    try {
      const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: 'AddressGeneral',
          calledMethod: 'getWarehouses',
          methodProperties: { CityRef: ref }
        })
      });

      const data = await res.json();
      warehouseSelect.innerHTML = '<option disabled selected>Оберіть відділення</option>';

      if (data.success && data.data.length > 0) {
        data.data.forEach(wh => {
          const opt = document.createElement('option');
          opt.value = wh.Description;
          opt.textContent = wh.Description;
          warehouseSelect.appendChild(opt);
        });
      } else {
        warehouseSelect.innerHTML = '<option disabled selected>Відділення не знайдені</option>';
      }
    } catch (err) {
      console.error('Warehouse fetch error:', err);
      warehouseSelect.innerHTML = '<option disabled selected>Помилка при завантаженні</option>';
    }
  }

  function validateOrderData(data) {
    const phoneRegex = /^\+?\d{10,14}$/;
    if (!phoneRegex.test(data.phone)) {
      messageBox.textContent = 'Некоректний номер телефону';
      return false;
    }
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(data.email)) {
      messageBox.textContent = 'Некоректна email адреса';
      return false;
    }
    if (!data.warehouse) {
      messageBox.textContent = 'Оберіть відділення';
      return false;
    }
    return true;
  }

  orderForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitButton = e.target.querySelector('button');
    submitButton.disabled = true;

    const data = {
      fullname: document.getElementById('fullname').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      city: cityInput.value.trim(),
      warehouse: warehouseSelect.value,
      product_id: 1
    };

    if (!validateOrderData(data)) {
      submitButton.disabled = false;
      messageBox.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      const res = await fetch('php/order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const response = await res.json();

      if (response.success) {
        messageBox.textContent = 'Замовлення відправлено!';
        orderForm.reset();
        warehouseSelect.innerHTML = '<option disabled selected>Оберіть відділення</option>';
      } else {
        messageBox.textContent = 'Помилка при надсиланні.';
      }
    } catch (err) {
      console.error('Order error:', err);
      messageBox.textContent = 'Помилка зв’язку із сервером.';
    } finally {
      submitButton.disabled = false;
      messageBox.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ===== КОМЕНТАРІ ТА РЕЙТИНГ =====
  async function loadComments() {
    try {
      const res = await fetch('php/get-comments.php');
      const data = await res.json();

      commentsList.innerHTML = '';
      let totalRating = 0;

      data.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
          <strong>${comment.name}</strong> <small>${comment.created_at}</small>
          <p>Рейтинг: ${comment.rating ? comment.rating + '⭐' : '—'}</p>
          <p>${comment.text}</p>
        `;
        commentsList.appendChild(div);
        if (comment.rating) totalRating += +comment.rating;
      });

      const avg = data.length ? (totalRating / data.length).toFixed(1) : '—';
      avgRatingContainer.textContent = `Середній рейтинг: ${avg} ⭐`;
    } catch (err) {
      console.error('Load comments error:', err);
    }
  }
  loadComments();

  commentForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('comment-name').value.trim();
    const text = document.getElementById('comment-text').value.trim();
    const rating = +ratingInput.value;

    if (!rating) {
      alert('Будь ласка, оберіть рейтинг.');
      return;
    }

    try {
      const res = await fetch('php/comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text, rating })
      });
      const response = await res.json();

      if (response.success) {
        commentForm.reset();
        setRating(0);
        loadComments();
        messageBox.textContent = 'Дякуємо за відгук!';
        messageBox.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  });

  function setRating(rating) {
    ratingInput.value = rating;
    stars.forEach(star => {
      if (+star.dataset.value <= rating) star.classList.add('selected');
      else star.classList.remove('selected');
    });
  }

  stars.forEach(star => {
    star.addEventListener('click', () => setRating(+star.dataset.value));
    star.addEventListener('mouseover', () => {
      const val = +star.dataset.value;
      stars.forEach(s => {
        if (+s.dataset.value <= val) s.classList.add('hover');
        else s.classList.remove('hover');
      });
    });
    star.addEventListener('mouseout', () => {
      stars.forEach(s => s.classList.remove('hover'));
      setRating(+ratingInput.value);
    });
  });

  setRating(0);

