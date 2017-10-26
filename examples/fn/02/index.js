function a() {
    function b() {
        alert();
    }

    b();
}

function c() {
    function b() {
        console.log('another letter b');
    }

    return b;
}

const d = c();

d();
