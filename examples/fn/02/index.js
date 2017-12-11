function a() {
    function b() {
        alert();
    }

    b();

    return function() {}
}

function c() {
    function b(text) {
        console.log(text);
    }

    return b;
}

const d = c();

d();
