import web3
import json
import app
import mongodb as md


class Storage:
    admin = ''
    contract_address = ''
    ganache_address = '127.0.0.1'
    ganache_port = '8545'
    ganache_url = f'HTTP://{ganache_address}:{ganache_port}'
    w3 = web3.Web3(web3.HTTPProvider(ganache_url))
    contract = ''

    def __init__(self, contract_address):
        self.contract_address = contract_address
        with open("abi.json", "r") as file:
            abi = json.load(file)
            self.contract = self.w3.eth.contract(address=contract_address, abi=abi)
        self.admin = self.get_admin_address()

    def get_admin_address(self):
        return self.contract.functions.getAdminAddress().call()

    def get_accounts(self):
        return self.w3.eth.accounts

    def get_account_balance(self, address):
        address = web3.Web3.toChecksumAddress(address)
        if address in self.get_accounts():
            return self.w3.fromWei(self.w3.eth.get_balance(address), 'ether')

    def get_product_info(self, id):
        return self.contract.functions.products(int(id)).call()

    def get_deal_info(self, id):
        return self.contract.functions.deals(int(id)).call()

    def add_vendor(self, addr, id, name, contact):
        addr = web3.Web3.toChecksumAddress(addr)
        if addr in self.get_accounts():
            tx = self.contract.functions.addVendor(addr, int(id), name, contact).transact(
                {'from': self.admin})
            self.w3.eth.waitForTransactionReceipt(tx)

    def add_buyer(self, addr, id, name, contact):
        addr = web3.Web3.toChecksumAddress(addr)
        if addr in self.get_accounts():
            tx = self.contract.functions.addBuyer(addr, int(id), name, contact).transact(
                {'from': self.admin})
            self.w3.eth.waitForTransactionReceipt(tx)

    def add_product(self, addr_from, id, name, units, quant, price, user_id):
        if md.add_user_product_id(str(user_id), int(id)):
            addr_from = web3.Web3.toChecksumAddress(addr_from)
            tx = self.contract.functions.addProduct(int(id), name, units, int(quant), int(price)).transact(
                {'from': addr_from})
            self.w3.eth.waitForTransactionReceipt(tx)
        else:
            raise Exception("Error! Such id is already exists!")

    def make_deal(self, addr_from, vendor_addr, product_id, quant):
        vendor_addr = web3.Web3.toChecksumAddress(vendor_addr)
        addr_from = web3.Web3.toChecksumAddress(addr_from)
        id = md.add_deal_id_to_admin()

        product_price = int(self.get_product_info(product_id)[5])
        quant = int(quant)
        tx = self.contract.functions.makeDeal(int(id), vendor_addr, int(product_id), int(quant)).transact(
            {'from': addr_from,
             'value': quant * product_price})
        self.w3.eth.waitForTransactionReceipt(tx)
