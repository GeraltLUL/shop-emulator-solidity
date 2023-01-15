from flask import Flask, request, abort, jsonify, render_template, session, redirect, url_for, make_response, flash
from flask_login import LoginManager, current_user, login_required, logout_user, login_user
import os
from flask_cors import CORS
from pymongo import MongoClient
from forms import FormRegister, FormLogin
import mongodb as md
from storage import Storage

storage = Storage('0x245F91FD151E45CBcf84899CDce5D06AfA2E51C9')

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')
app.config['SECURITY_UNAUTHORIZED_VIEW'] = '/login'
app.config.from_object(__name__)
CORS(app)

client = MongoClient('localhost', 27017)
db = client['Blockchain']
collection_users = db['users']

login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access the site'
login_manager.login_message_category = 'success'


@login_manager.user_loader
def load_user(user_id):
    return md.find_record('id', user_id)


@app.after_request
def apply_caching(response):
    response.headers['X-Frame-Options'] = 'ALLOW'
    return response


@app.route('/')
@app.route('/index')
@login_required
def index():
    if session is None or 'id' not in session.keys():
        logout_user()
        return redirect(url_for('login'))
    if current_user.is_admin == 1:
        status = 'Administrator'
        return render_template('admin.html', title='Admin Page', username=current_user.name,
                               status=status,
                               balance=storage.get_account_balance(current_user.address))
    elif current_user.user_type == 0:
        status = 'Buyer'
        return render_template('buyer.html', title='Buyer Page', username=current_user.name,
                               status=status,
                               balance=storage.get_account_balance(current_user.address),
                               isAdminExists=md.is_admin_exists() and storage != '')
    else:
        status = 'Vendor'
        return render_template('vendor.html', title='Vendor Page', username=current_user.name,
                               status=status,
                               balance=storage.get_account_balance(current_user.address),
                               isAdminExists=md.is_admin_exists() and storage != '')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = FormRegister()

    if form.validate_on_submit():
        user_db = md.find_record('email', form.email.data)

        if user_db is None:
            md.create_record(form)
            flash('You have successfully registered', 'success')
            return redirect(url_for('login'))
        else:
            flash('User with such email is already exists', 'error')

    return render_template('register.html', form=form)


@app.route('/login', methods=['POST', 'GET'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = FormLogin()
    if form.validate_on_submit():
        user_db = md.find_record('email', form.email.data)

        if user_db is not None and md.check_password(form.password.data.encode('utf-8'), user_db.password):
            resp = make_response(redirect(url_for('index')))

            resp.set_cookie(key='id', value=user_db.id)
            session['id'] = user_db.id

            checkbox = True if form.remember.data else False

            login_user(user_db, remember=checkbox)
            return resp

        flash('Wrong password or login', 'error')

    return render_template('login.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    resp = make_response(redirect(url_for('login')))

    resp.delete_cookie(key='id')
    session.pop('id', default=None)

    flash('You logged out of the profile', 'success')

    return resp

@app.route('/add_vendor_product', methods=['POST'])
@login_required
def add_vendor_product():
    product_id = request.get_json()['productId']
    name = request.get_json()['name']
    units = request.get_json()['units']
    price = request.get_json()['price']
    quantity = request.get_json()['quantity']
    try:
        storage.add_product(current_user.address, product_id, name, units, quantity, price, current_user.id)
        print('200')
        return '200'
    except Exception as e:
        print(e)
        return '500'


@app.route('/get_all_products')
@login_required
def get_all_products():
    if current_user.user_type != 0:  # is buyer
        return abort(401)

    products_id = md.find_all_products_id()
    res = []

    for id in products_id:
        product_data = storage.get_product_info(id)

        product = dict()

        product['id'] = product_data[0]
        product['vendorId'] = product_data[1]
        product['name'] = product_data[2]
        product['units'] = product_data[3]
        product['quantity'] = product_data[4]
        product['price'] = product_data[5]
        product['vendorAddress'] = product_data[6]

        res.append(product)

    return jsonify(res)


@app.route('/get_all_deals')
@login_required
def get_all_deals():
    if current_user.is_admin != 1:  # is admin
        return abort(401)

    deals_id = current_user.user_products
    res = []

    for id in deals_id:
        deal_data = storage.get_deal_info(id)

        deal = dict()

        deal['dealId'] = deal_data[0]
        deal['productId'] = deal_data[1]
        deal['vendorId'] = deal_data[2]
        deal['buyerId'] = deal_data[3]
        deal['quantity'] = deal_data[4]

        res.append(deal)

    return jsonify(res)


@app.route('/get_user_balance')
@login_required
def get_user_balance():
    return str(storage.get_account_balance(current_user.address))

@app.route('/get_vendor_products')
@login_required
def get_vendor_products():
    if current_user.user_type != 1:  # is vendor
        return abort(401)

    products_id_arr = current_user.user_products
    res = []

    for id in products_id_arr:
        product_data = storage.get_product_info(id)

        product = dict()

        product['id'] = product_data[0]
        product['vendorId'] = product_data[1]
        product['name'] = product_data[2]
        product['units'] = product_data[3]
        product['quantity'] = product_data[4]
        product['price'] = product_data[5]
        product['vendorAddress'] = product_data[6]

        res.append(product)
    return jsonify(res)


@app.route('/make_deal', methods=['POST'])
@login_required
def buy_product():
    vendor_addr = request.get_json()['vendorAddress']
    quant = request.get_json()['quantity']
    product_id = request.get_json()['productId']
    print(quant)
    storage.make_deal(current_user.address, vendor_addr, product_id, quant)
    return '200'

if __name__ == '__main__':
    #add_user_product_id('9a96d14c-955b-4d03-8c69-78915dfabe16', '1')
    app.run(debug=True, port=5000, host='0.0.0.0')
