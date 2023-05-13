document.querySelectorAll('.select').forEach((dropDownWrapper, i) => {
	const dropMenuBtn = dropDownWrapper.querySelector('.select__button');
	const dropMenuContent = dropDownWrapper.querySelector('.select__dropdown');
	const dropMenuListItems = dropDownWrapper.querySelectorAll('.select__list li');
	const dropMenuInput = dropDownWrapper.querySelector('.select__input');
	dropMenuBtn.addEventListener('click', (e) => {
		dropDownWrapper.classList.toggle('isOpen');
		e.target.classList.toggle('isActive');
	});
	[...dropMenuListItems].forEach((listItem) => {
		listItem.addEventListener('click', (e) => {
			e.stopPropagation();
			dropMenuBtn.focus();
			dropMenuInput.value = listItem.textContent;
			dropDownWrapper.classList.remove('isOpen');
			dropMenuBtn.classList.remove('isActive');
		});
	});
	// Клик снаружи дропдауна. Закрыть дропдаун
	document.addEventListener('click', (e) => {
		if (e.target !== dropMenuBtn) {
			dropDownWrapper.classList.remove('isOpen');
			dropMenuBtn.classList.remove('isActive');
		}
	});
	// Нажатие на Tab или Escape. Закрыть дропдаун
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Tab' || e.key === 'Escape') {
			dropDownWrapper.classList.remove('isOpen');
			dropMenuBtn.classList.remove('isActive');
		}
	});
})