import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from "web3";
const ethers = require('ethers')
const passworder = require('browser-passworder');
// import TBTC from './tbtc.js/TBTC.js'
const umbra = require('umbra-js');
const { RandomNumber, KeyPair, utils, ens } = umbra
// import TBTC from '@keep-network/tbtc.js'

let web3
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  try { 
     window.ethereum.enable().then(function() {
         // User has allowed account access to DApp...
         web3.eth.defaultAccount = window.web3.eth.defaultAccount
     });
  } catch(e) {
     // User has denied account access to DApp...
  }
}
// Legacy DApp Browsers
else if (window.web3) {
   web3 = new Web3(window.web3.currentProvider);
}
// Non-DApp Browsers
else {
   alert('You have to install MetaMask !');
}

// async function test() {
//   const tbtc = await TBTC.withConfig({
//     web3: web3,
//     bitcoinNetwork: "testnet",
//     electrum: {
//       testnet: {
//         server: "electrumx-server.test.tbtc.network",
//         port: 50002,
//         protocol: "ssl"
//       },
//       testnetPublic: {
//         server: "testnet1.bauerj.eu",
//         port: 50002,
//         protocol: "ssl"
//       },
//       testnetWS: {
//         server: "electrumx-server.test.tbtc.network",
//         port: 8443,
//         protocol: "wss"
//       }
//     }
//   })

//   const lotSizes = await tbtc.Deposit.availableSatoshiLotSizes()

//   console.log("Initiating deposit...")
//   const deposit = await tbtc.Deposit.withSatoshiLotSize(lotSizes[0])
//   deposit.autoSubmit()
//   deposit.onBitcoinAddressAvailable(async address => {
//     const lotSize = await deposit.getSatoshiLotSize()
//     console.log(
//       "\tGot deposit address:",
//       address,
//       "; fund with:",
//       lotSize.toString(),
//       "satoshis please."
//     )
//     console.log("Now monitoring for deposit transaction...")
//   })

//   return await new Promise((resolve, reject) => {
//     console.log("Waiting for active deposit...")
//     try {
//       deposit.onActive(async () => {
//         try {
//           console.log("Deposit is active, minting...")
//           const tbtc = await deposit.mintTBTC()
//           console.log(`Minted ${tbtc} TBTC!`)
//           // or
//           // (await deposit.getTDT()).transfer(someLuckyContract)
//         } catch (error) {
//           reject(error)
//         }
//       })
//     } catch (error) {
//       reject(error)
//     }
//   })
// }

// test()
//   .then(() => {
//     console.log("All done!")
//   })
//   .catch(error => {
//     console.error("Boom boom time", error)
//   })

async function encryptPrivateKey(password, dataToEncrypt) {
  const encrypted = await passworder.encrypt(password, dataToEncrypt);
  return encrypted;
}

async function decryptPrivateKey(password, dataToDecrypt) {
  const decrypted = await passworder.decrypt(password, dataToDecrypt);
  return decrypted;
}

function App() {
    const [pubKey, setPubKey] = useState("");
    const [privKey, setPrivKey] = useState("")
    const [password, setPassword] = useState("hello")

    var wallet, randomNumber, stealthFromPublic;

    const setup = async () => {
      // Generate a random wallet to simulate the recipient
      wallet = ethers.Wallet.createRandom()

      // Encrypt private key and corresponding web3 wallet
      const data = {
        privateKey: wallet.privateKey, // randomly generated private key
        expectedWeb3Address: web3.eth.defaultAccount, // web3 wallet user is logged in with
      };

      const encrypted = await encryptPrivateKey(password, data);

      // Save to localStorage, read from localStorage, and decrypt to confirm everything worked
      window.localStorage.setItem('umbra-data', encrypted);
      const localStorageData = window.localStorage.getItem('umbra-data');
      const decrypted = await decryptPrivateKey(password, localStorageData);

      const isPrivateKeyEqual = data.privateKey === decrypted.privateKey;
      const isExpectedWeb3AddressEqual = data.expectedWeb3Address === decrypted.expectedWeb3Address;
      const wasSuccessful = isPrivateKeyEqual && isExpectedWeb3AddressEqual;

      if (!wasSuccessful) {
        throw new Error('Something went wrong during account setup. Please refresh the page and try again.');
      }
    }

    const sendFunds = () => {
      // Get a random 32-byte number
      randomNumber = new RandomNumber()

      // Generate a KeyPair instance from recipient's public key
      const recipientFromPublic = new KeyPair(wallet.publicKey);

      // Multiply public key by the random number to get a new KeyPair instance
      stealthFromPublic = recipientFromPublic.mulPublicKey(randomNumber)

      // Send fund's to the recipient's stealth receiving address
      console.log('Stealth recipient address: ', stealthFromPublic.address);
    }

    const receiveFunds = () => {
      // Generate a KeyPair instance based on their own private key
      const recipientFromPrivate = new KeyPair(wallet.privateKey);

      // Multiply their private key by the random number to get a new KeyPair instance
      const stealthFromPrivate = recipientFromPrivate.mulPrivateKey(randomNumber);

      // Access funds and confirm addresses match
      console.log(stealthFromPublic.address === stealthFromPrivate.address); // true
      console.log('Private key to access received funds: ', stealthFromPrivate.privateKeyHex);
    }

    useEffect(() => {
      setup()
      sendFunds()
      receiveFunds()
    }, [])

    return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          <input type="text" value={pubKey} onChange={e => setPubKey(e.target.value)} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </p>
      </header>
    </div>
  );
}

export default App;
