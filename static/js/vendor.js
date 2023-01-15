const baseUrl = `http://${document.location.host}`;
const tableBody = document.querySelector('#storage-table');
const inputForm = document.querySelector('#input-form');
const sendFormButton = inputForm.querySelector('#sendForm');

window.onload = () => {
    getData(`${baseUrl}/get_vendor_products`)
        .then(resp => resp.json())
        .then(data => {
            data.forEach(product => {
                console.log(product);
                addTableElement(product.id, product.name,
                    product.units, product.price, product.quantity);
            });
        });
};

let addTableElement = (id, name, units, price, quant, mode = 0) => {
    if (mode == 0 || (mode != 0 && parseInt(id) >= 0 && name && units && parseInt(price) > 0 && parseInt(quant) > 0)) {
        if (mode == 1) {
            postData(`${baseUrl}/add_vendor_product`, {
                productId: id,
                name: name,
                units: units,
                price: price,
                quantity: quant
            })
                .then(resp => resp.json())
                .then(data => {
                    console.log(data);
                    if (data != 200) {
                        const toastError = document.querySelector('#errorToast');
                        const toast = new bootstrap.Toast(toastError);
                        toast.show();
                        return false;
                    }
                    else {
                        return true;
                    }
                })
                .then(data => {
                    console.log(data);
                    if (data == true) {
                        const element = document.createElement('tr');
                        let argArr = Array();
                        argArr.push(id);
                        argArr.push(name);
                        argArr.push(units);
                        argArr.push(price);
                        argArr.push(quant);
                        for (let i = 0; i < argArr.length; i++) {
                            let tableSon;
                            if (i == 0) {
                                tableSon = document.createElement('th');
                            }
                            else {
                                tableSon = document.createElement('td');
                            }
                            tableSon.textContent = argArr[i];
                            tableSon.classList.add('text-center');
                            element.append(tableSon);
                        }
                        console.log(element);
                        tableBody.append(element);
                        const toastSuccess = document.querySelector('#successToast');
                        const toast = new bootstrap.Toast(toastSuccess);
                        toast.show();
                    }
                });
        }
        else {
            const element = document.createElement('tr');
            let argArr = Array();
            argArr.push(id);
            argArr.push(name);
            argArr.push(units);
            argArr.push(price);
            argArr.push(quant);
            for (let i = 0; i < argArr.length; i++) {
                let tableSon;
                if (i == 0) {
                    tableSon = document.createElement('th');
                }
                else {
                    tableSon = document.createElement('td');
                }
                tableSon.textContent = argArr[i];
                tableSon.classList.add('text-center');
                element.append(tableSon);
            }
            console.log(element);
            tableBody.append(element);
        }
    }
};

let isStringContainsOnlyDigits = (s) => {
    for (let i = 0; i < s.length; i++) {
        if (!/^[0-9]+$/.test(s[i])) {
            return false;
        }
    }
    return true;
};

inputForm.querySelector('#id').addEventListener('input', (e) => {
    let ths = tableBody.querySelectorAll('th'), flag = false;

    for (let i = 0; i < ths.length; i++) {
        if (ths[i].textContent == e.target.value) {
            flag = true;
            break;
        }
        else {
            flag = false;
        }
    }

    if (!isStringContainsOnlyDigits(e.target.value) || flag == true || e.target.value == '0') {
        e.target.style.background = '#de2518';
    }
    else {
        e.target.style.background = '';
    }
});

inputForm.querySelector('#price').addEventListener('input', (e) => {
    if (!isStringContainsOnlyDigits(e.target.value) || e.target.value == '0') {
        e.target.style.background = '#de2518';
    }
    else {
        e.target.style.background = '';
    }
});

inputForm.querySelector('#quantity').addEventListener('input', (e) => {
    if (!isStringContainsOnlyDigits(e.target.value) || e.target.value == '0') {
        e.target.style.background = '#de2518';
    }
    else {
        e.target.style.background = '';
    }
});

sendFormButton.addEventListener('click', () => {
    let name = inputForm.querySelector('#name').value,
        id = inputForm.querySelector('#id').value,
        units = inputForm.querySelector('#units').value,
        price = inputForm.querySelector('#price').value,
        quantity = inputForm.querySelector('#quantity').value;


    if (id != '' && quantity != '' && price != '' &&
        parseInt(id) >= 0 && parseInt(quantity) > 0 && parseInt(price) > 0 &&
        isStringContainsOnlyDigits(id) && isStringContainsOnlyDigits(quantity) &&
        isStringContainsOnlyDigits(price) && inputForm.querySelector('#id').style.background != '#de2518') {
        addTableElement(id, name, units, price, quantity, 1);

        inputForm.querySelector('#name').value = '';
        inputForm.querySelector('#id').value = '';
        inputForm.querySelector('#units').value = '';
        inputForm.querySelector('#price').value = '';
        inputForm.querySelector('#quantity').value = '';
    }
});

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