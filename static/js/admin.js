const baseUrl = `http://${document.location.host}`;
const tableBody = document.querySelector('#storage-table');

window.onload = () => {
	getData(`${baseUrl}/get_all_deals`)
		.then(resp => resp.json())
		.then(data => {
			data.forEach(deal => {
				console.log(deal);
				addTableElement(deal.dealId, deal.productId,
					deal.vendorId, deal.buyerId, deal.quantity);
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


let addTableElement = (dealId, productId, vendorId, buyerId, quantity) => {
	console.log('hello');
	const element = document.createElement('tr');
	let argArr = Array();
	argArr.push(dealId);
	argArr.push(productId);
	argArr.push(vendorId);
	argArr.push(buyerId);
	argArr.push(quantity);

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
		console.log(tableSon);
		tableSon.textContent = argArr[i];
		element.append(tableSon);
		tableBody.append(element);
	}
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