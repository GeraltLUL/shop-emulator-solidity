from app import collection_users, storage
from flask_login import UserMixin
import uuid
import web3
import bcrypt


class Users(UserMixin):
    address = str()
    id = str()
    name = str()
    email = str()
    password = str()
    user_type = 0  # 0 - buyer; 1 - vendor
    is_admin = 0  # 1 - admin; 0 - not admin
    user_products = []

    def __init__(self, id, name, email, password, user_type, is_admin, user_products, address):
        self.id = id
        self.name = name
        self.email = email
        self.password = password
        self.user_type = user_type
        self.is_admin = is_admin
        self.user_products = user_products
        self.address = address

    def to_json(self):
        return {
            "id": self.id,
            "address": self.address,
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "user_type": self.user_type,
            "is_admin": self.is_admin,
            "user_products": self.user_products
        }

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password, bcrypt.gensalt())


def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password, hashed_password)


def create_record(form):
    addr = web3.Web3.toChecksumAddress(form.address.data)

    if addr in storage.get_accounts():
        is_admin = 1 if addr == storage.get_admin_address() else 0
        user_type = 1 if form.user_type.data == True else 0
        users_size = 0

        for user in collection_users.find():
            users_size += 1

        if user_type == 0:
            storage.add_buyer(addr, users_size + 1, form.name.data, form.email.data)
        else:
            storage.add_vendor(addr, users_size + 1, form.name.data, form.email.data)

        collection_users.insert_one({
            'id': str(users_size + 1),
            'address': addr,
            'name': form.name.data,
            'email': form.email.data,
            'password': get_hashed_password(form.password.data),
            'user_type': user_type,
            'is_admin': is_admin,
            'user_products': []
        })


def find_record(key, value):
    user = collection_users.find_one({key: value})
    if user is not None:
        return Users(id=user['id'],
                     address=user['address'],
                     name=user['name'],
                     email=user['email'],
                     password=user['password'],
                     user_type=user['user_type'],
                     is_admin=user['is_admin'],
                     user_products=user['user_products'])
    else:
        return None


def find_all_products_id():
    res = []
    vendors = collection_users.find({'user_type': 1})
    for vendor in vendors:
        for product_id in vendor['user_products']:
            res.append(product_id)

    return res


def add_user_product_id(user_id, product_id):
    for user in collection_users.find():
        for id in user['user_products']:
            if int(id) == int(product_id):
                return False

    collection_users.update_one(
        {'id': user_id},
        {'$push': {'user_products': product_id}}
    )
    return True


def add_deal_id_to_admin():
    id = 0
    admin = collection_users.find({'is_admin': 1})
    for deal in admin[0]['user_products']:
        id += 1

    collection_users.update_one(
        {'is_admin': 1},
        {'$push': {'user_products': id + 1}}
    )

    return id + 1


def is_admin_exists():
    users = collection_users.find()
    for user in users:
        if user['is_admin'] == 1:
            return True

    return False
