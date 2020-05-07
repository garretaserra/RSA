'use strict';
let cryptoUtils = require('bigint-crypto-utils');

class my_rsa{

    constructor() {
        this.publicKey = {};
        this.privateKey = {};

        //Two distinct prime numbers -> Co-Primes
        Promise.all([cryptoUtils.prime(1024, 5), cryptoUtils.prime(1024, 5)]).then((values)=>{
            console.log('p & q generated')
            let p = values[0];
            let q = values[1];

            // n = p * q
            this.publicKey.n = p * q;
            this.privateKey.n= this.publicKey.n;

            //Calculate Totien function = (p-1)(q-1)
            let phi = (p-BigInt(1))*(q-BigInt(1));

            //"e" has to be coprime with phi
            this.publicKey.e = BigInt(65537);

            //Let's check if it is a coprime
            if (cryptoUtils.gcd(this.publicKey.n, this.publicKey.e) !== BigInt(1)) {
                console.log('Restarting RSA initialization: e and n are not coprime');
                return new my_rsa();
            }

            // Check that e and phi are coprime
            if(cryptoUtils.gcd(phi, this.publicKey.e) !== BigInt(1)){
                console.log('Restarting RSA initialization: e and phi are not coprime');
                return new my_rsa();
            }

            //Calculate d=e^(-1) mod phi(n)
            this.privateKey.d = cryptoUtils.modInv(this.publicKey.e, phi);
        })
    }


    /**
     * Decrypt the encrypted message
     * If cypher is less than n.
     *
     * @param {bigint} cypher : encrypted message to decrypt.
     *
     * @returns {bigint} message : decrypted message.
     *
     * message = cypher^d mod n
     * d : Private exponent
     * n : Public modulus
     */
    decrypt(cypher){
        this.checkLessThanN(cypher);
        return cryptoUtils.modPow(cypher, this.privateKey.d, this.publicKey.n);
    }

    /**
     * Sign the message.
     * If message us less tha n.
     *
     * @param {bigint} message: message to sing.
     *
     * @returns {bigint} Signature.
     *
     * signature = message^d mod n
     * d : Private exponent
     * n : Public modulus
     */
    sign(message){
        this.checkLessThanN(message);
        return cryptoUtils.modPow(message, this.privateKey.d, this.publicKey.n);
    }

    /**
     * Encrypt a message.
     * If message is less than n.
     *
     * @param {bigint} message: message to encrypt.
     *
     * @returns {bigint}  cypher: message encrypted.
     *
     * cypher = message^e mod n
     * e : Public exponent
     * n : Public modulus
     */
    encrypt(message){
        this.checkLessThanN(message);
        return cryptoUtils.modPow(message, this.publicKey.e, this.publicKey.n);
    }

    static encrypt(message, e, n){
        return cryptoUtils.modPow(message, e, n);
    }

    /**
     * Check if the signature is correct
     * If signature is less than n.
     *
     * @param {bigint} signature: signature to verify
     *
     * @param {bigint} e: Public exponent
     *
     * @param {bigint} n: Public modulus
     *
     * @returns {bigint}  The signature is correct if message = signature^e mod n
     *
     */
    static verify(signature, e, n){
        return  cryptoUtils.modPow(signature, e, n)
    }

    /**
     * Blind a message with a blinding factor
     * The message to be blinded and the public key (e,n) of the entity signing
     *
     * @param {bigint} message: message to be blind.
     *
     * @param {bigint} e: Public exponent
     *
     * @param {bigint} n: Public modulus
     *
     * @returns {{r: bigint, blindedMessage: bigint}}  blindedMessage = message * r^e mod n
     *
     *  r: blind factor  r ϵ Zn * such as gcd(r,n) = 1
     */
    static blind(message, e, n){
        const r = this.generateRandomPrime();

        if(!this.checkCoPrime(n, r)){
            console.log('The numbers: ', n, ' and ', r, ' are not coPrime');
            return this.blind(message, e, n);
        }

        return {
            blindedMessage: (message * cryptoUtils.modPow(r, e, n)) % n,
            r: r
        };
    }

    /**
     * Unblind cryptogram in order to obtain the signature
     *
     * @param {bigint} cryptogram: message to unblind
     *
     * @param {bigint} r: blind factor
     *
     * @param {bigint} n: Public modulus
     *
     * @returns {bigint}  Signature = cryptogram * r^-1 mod n
     * Inverse modular : r^(-1) mod (n)
     */
    static unBlind(cryptogram, r, n){
        let signature = (cryptogram * cryptoUtils.modInv(r,n)) % n;
        return BigInt(signature);
    }

    /**
     * Check if the numbers are coprime if  gcd(a,b) = 1
     *
     * @param {bigint} number: one of the two numbers to compare
     *
     * @param {bigint} otherNumber: one of the two numbers to compare
     *
     * @returns {boolean}
     */
    static checkCoPrime(number, otherNumber){
        return cryptoUtils.gcd(number, otherNumber) === BigInt(1)
    }

    /**
     * Check if a number is less than n.
     *
     * n: Public modulus
     *
     * @param {bigint} number: number to check
     *
     */
    checkLessThanN(number){
        if(number > this.publicKey.n){
            console.log('The number does not meet the condition less than n');
        }
    }

    /**
     * Generate a random prime
     *
     * @returns {bigint}  Random prime number
     */
    static generateRandomPrime() {
        return cryptoUtils.primeSync(1024,5);
    }
}
module.exports = my_rsa;
