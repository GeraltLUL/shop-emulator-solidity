const baseUrl = `http://${document.location.host}`;
const tableBody = document.querySelector('#storage-table');

window.onload = () => {
	getData(`${baseUrl}/get_all_products`)
		.then(resp => resp.json())
		.then(data => {
			data.forEach(product => {
				console.log(product);
				addTableElement(product.id, product.vendorId, product.name,
					product.units, product.price, product.quantity, product.vendorAddress);
			});
		});
};

let isStringContainsOnlyDigits = (s) => {
	for (let i = 0; i < s.length; i++) {
		if (!/^[0-9]+$/.test(s[i])) {
			return false;
		}
	}
	return true;
};


let addTableElement = (productId, vendorId, name, units, price, quant, vendorAddr) => {
	const element = document.createElement('tr');
	let argArr = Array();
	argArr.push(productId);
	argArr.push(vendorId);
	argArr.push(name);
	argArr.push(units);
	argArr.push(price);
	argArr.push(quant);

	for (let i = 0; i < argArr.length; i++) {
		let tableSon;
		if (i == 0) {
			tableSon = document.createElement('th');
			tableSon.classList.add('text-center');
		}
		else {
			tableSon = document.createElement('td');
			tableSon.classList.add('text-center');
		}
		tableSon.textContent = argArr[i];
		element.append(tableSon);
	}
	let tableSon = document.createElement('td');

	let wrapper = document.createElement('div');
	wrapper.classList.add('d-flex');

	const inputField = document.createElement('input');
	inputField.placeholder = 'Enter quantity';
	inputField.setAttribute('type', 'text');

	const buyButton = document.createElement('button');

	buyButton.classList.add('form-control');
	buyButton.classList.add('btn');
	buyButton.classList.add('btn-success');
	buyButton.setAttribute('type', 'button');
	buyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-dollar" viewBox="0 0 16 16">
  <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
</svg>`;
	buyButton.style.backgroundColor = 'green';
	tableSon.style.width = '15%';
	inputField.style.width = '70%';
	inputField.style.marginRight = '3%';
	buyButton.style.width = '30%';

	wrapper.append(inputField);
	wrapper.append(buyButton);
	tableSon.append(wrapper);
	element.append(tableSon);
	tableBody.append(element);

	inputField.addEventListener('input', (e) => {
		console.log(e.target.value);
		if (parseInt(e.target.value) <= 0 || parseInt(e.target.value) > quant || !isStringContainsOnlyDigits(e.target.value)) {
			e.target.style.background = '#de2518';
		}
		else {
			e.target.style.background = '';
		}
	});

	buyButton.addEventListener('click', () => {
		let val = inputField.value;
		console.log(val);
		if (parseInt(val) > 0 && parseInt(val) <= quant && isStringContainsOnlyDigits(val)) {
			tableSon.querySelector('input').style.backgroundColor = '';
			postData(`${baseUrl}/make_deal`, {
				vendorAddress: vendorAddr,
				quantity: val,
				productId: productId
			})
				.then(resp => resp.json())
				.then(data => {
					if (data == '200') {
						const quantityElement = tableSon.previousElementSibling;
						quantityElement.textContent = parseInt(quantityElement.textContent) - val;
						inputField.value = '';
						const toastSuccess = document.querySelector('#successToast');
						const toast = new bootstrap.Toast(toastSuccess);
						toast.show();
					}
					else {
						const toastError = document.querySelector('#errorToast');
						const toast = new bootstrap.Toast(toastError);
						toast.show();
					}
				});
		}

	});
};

async function postData(url = '', data = {}) {
	const response = await fetch(url, {
		method: 'POST',
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json'
		},
		redirect: 'follow',
		referrerPolicy: 'no-referrer',
		body: JSON.stringify(data)
	});
	return response;
}

async function getData(url = '') {
	const response = await fetch(url, {
		method: 'GET',
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'same-origin'
	});
	return response;
}