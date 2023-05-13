import noUiSlider from 'nouislider';
const rangeSlider = document.getElementById('slider');
if (rangeSlider) {
	const rangeSliderValue = document.querySelector('.item-range__value');
	noUiSlider.create(slider, {
		start: [75],
		range: {
			'min': [0],
			'max': [100]
		}
	});
	rangeSlider.noUiSlider.on('update', (values, handle) => {
		rangeSliderValue.innerHTML = Math.round(values[handle]) + ' %';
	});
}