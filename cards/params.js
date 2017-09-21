// const IP = '161.53.18.58';
const IP = 'localhost';
const port = '8082';
if (typeof window === 'undefined') {
    exports.IP = IP;
    exports.port = port;
}