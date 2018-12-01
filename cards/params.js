//const IP = 'mornar.no-ip.org';
const IP = 'localhost';
const port = '8080';
if (typeof window === 'undefined') {
    exports.IP = IP;
    exports.port = port;
}
