document.addEventListener('DOMContentLoaded', () => {
    // --- Main App Configuration ---
    const SECURE_API_ENDPOINT = '/api/get-rate'; 

    const state = {
        rate: 0,
        amount: 0,
        convertToBaht: true,
        adminRateMMKtoTHB: 0,
        adminRateTHBtoMMK: 0,
    };
    
    const dom = {
        rateInput: document.getElementById('rate-input'),
        amountInput: document.getElementById('amount-input'),
        resultText: document.getElementById('result-text'),
        resultContainer: document.getElementById('result-container'),
        rateHelper: document.getElementById('rate-helper'),
        amountPrefix: document.getElementById('amount-prefix'),
        toggleMmktThb: document.getElementById('toggle-mmk-thb'),
        toggleThbMmk: document.getElementById('toggle-thb-mmk'),
        clearButton: document.getElementById('clear-button'),
        liveClock: document.getElementById('live-clock'),
        copyButton: document.getElementById('copy-button'),
        adminRateMmktThb: document.getElementById('admin-rate-mmk-thb'),
        adminRateThbMmk: document.getElementById('admin-rate-thb-mmk'),
        refreshRateBtn: document.getElementById('refresh-rate-btn'),
        officialRateContainer: document.getElementById('official-rate-container'),
    };

    const commaFormatter = new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 3 });
    const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
    
    let debounceTimer;
    let helperTextTimeout;
    
    function updateClock() {
        const now = new Date();
        const options = { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        if(dom.liveClock) {
            dom.liveClock.textContent = `Bangkok: ${now.toLocaleString('en-US', options)}`;
        }
    }
    
    function updateToggleButtons() {
        const isMMKToTHB = state.convertToBaht;
        dom.toggleMmktThb.classList.toggle('bg-indigo-600', isMMKToTHB);
        dom.toggleMmktThb.classList.toggle('text-white', isMMKToTHB);
        dom.toggleMmktThb.classList.toggle('text-indigo-600', !isMMKToTHB);

        dom.toggleThbMmk.classList.toggle('bg-indigo-600', !isMMKToTHB);
        dom.toggleThbMmk.classList.toggle('text-white', !isMMKToTHB);
        dom.toggleThbMmk.classList.toggle('text-indigo-600', isMMKToTHB);

        dom.amountPrefix.textContent = isMMKToTHB ? 'MMK' : '฿';
    }

    function setAdminRateText(mmkThbMsg, thbMmkMsg) {
        dom.adminRateMmktThb.textContent = mmkThbMsg;
        dom.adminRateThbMmk.textContent = thbMmkMsg || mmkThbMsg;
    }

    function displayResult(text) {
        if (!text || parseFloat(text.replace(/[^\d.]/g, '')) === 0) {
            dom.resultContainer.classList.add('opacity-0', 'scale-95');
            return;
        }
        
        dom.resultContainer.classList.remove('opacity-0', 'scale-95');
        dom.resultText.textContent = text;
        
        dom.resultText.classList.remove('result-flip');
        void dom.resultText.offsetWidth;
        dom.resultText.classList.add('result-flip');
    }

    async function fetchAndUpdateRate(isManualRefresh = false) {
        if (isManualRefresh) {
            setAdminRateText('Refreshing...', 'Refreshing...');
        }
        
        try {
            const response = await fetch(SECURE_API_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const fetchedRateMMKtoTHB = parseFloat(data.mmk_thb);
            const fetchedRateTHBtoMMK = parseFloat(data.thb_mmk);

            if (fetchedRateMMKtoTHB > 0 && fetchedRateTHBtoMMK > 0) {
                state.adminRateMMKtoTHB = fetchedRateMMKtoTHB;
                state.adminRateTHBtoMMK = fetchedRateTHBtoMMK;

                setAdminRateText(
                    `${commaFormatter.format(fetchedRateMMKtoTHB)} THB`,
                    `${commaFormatter.format(fetchedRateTHBtoMMK)} THB`
                );
                
                dom.officialRateContainer.classList.add('rate-updated');
                setTimeout(() => dom.officialRateContainer.classList.remove('rate-updated'), 1200);

                if (dom.rateInput.value.trim() === '') {
                    calculateAndDisplay();
                }
            } else {
                throw new Error("Invalid rate data received from server.");
            }
        } catch (error) {
            console.error('Failed to fetch rate:', error);
            setAdminRateText('Load Failed', 'Load Failed');
            dom.rateHelper.textContent = 'Could not load official rate. Please enter one manually.';
        }
    }
    
    function calculateAndDisplay() {
        const userRateStr = dom.rateInput.value.replace(/,/g, '');
        const amountStr = dom.amountInput.value.replace(/,/g, '');
        
        const userRate = parseFloat(userRateStr) || 0;
        state.amount = parseFloat(amountStr) || 0;
        
        state.rate = userRate > 0 ? userRate : state.adminRateMMKtoTHB;
        
        clearTimeout(helperTextTimeout);
        if (state.rate > 0) {
            const mmkPerBaht = 100000 / state.rate;
            dom.rateHelper.textContent = `Using rate: 1 THB ≈ ${numberFormatter.format(mmkPerBaht)} MMK`;
        } else if (!userRateStr) {
            dom.rateHelper.textContent = 'Enter a rate or wait for official one to load.';
        }

        if (state.rate <= 0 || state.amount <= 0) {
            displayResult('');
            return;
        }
        
        let result = 0;
        let resultString = '';
        if (state.convertToBaht) {
            result = (state.amount / 100000) * state.rate;
            resultString = `฿ ${commaFormatter.format(result)}`;
        } else {
            const mmkPerBaht = 100000 / state.rate;
            result = state.amount * mmkPerBaht;
            resultString = `MMK ${commaFormatter.format(result)}`;
        }
        displayResult(resultString);
    }

    function formatNumericInput(e) {
        const input = e.target;
        const cursorPosition = input.selectionStart;
        const originalLength = input.value.length;

        let value = input.value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        let integerPart = parts[0];
        let decimalPart = parts.length > 1 ? `.${parts[1].substring(0,3)}` : '';
        
        let formattedInteger = integerPart.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        input.value = formattedInteger + decimalPart;

        const newLength = input.value.length;
        input.setSelectionRange(cursorPosition + (newLength - originalLength), cursorPosition + (newLength - originalLength));
    }

    function standardizeRate() {
        const rate = parseFloat(dom.rateInput.value.replace(/,/g, '')) || 0;
        if (rate > 0 && rate < 300) { 
            const standardRate = 100000 / rate;
            dom.rateInput.value = commaFormatter.format(standardRate);
            
            dom.rateHelper.textContent = 'Rate auto-corrected to standard format.';
            helperTextTimeout = setTimeout(() => calculateAndDisplay(), 2000);
        }
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    async function handleCopy() {
        if (!state.rate || !state.amount) return;

        const now = new Date();
        const timestamp = now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const rateFor100kMMK = state.rate;
        const rateFor1THB = 100000 / state.rate;
        const inputCurrency = state.convertToBaht ? 'MMK' : 'THB';
        const inputAmount = commaFormatter.format(state.amount);
        const resultString = dom.resultText.textContent;
        
        const textToCopy = `SCI Currency Conversion
-------------------------------------
Date: ${timestamp}
Rate Used: 100,000 MMK = ${commaFormatter.format(rateFor100kMMK)} THB
(1 THB ≈ ${numberFormatter.format(rateFor1THB)} MMK)
Input: ${inputAmount} ${inputCurrency}
Result: ${resultString}
-------------------------------------
Official MMK→THB: ${dom.adminRateMmktThb.textContent}
Official THB→MMK: ${dom.adminRateThbMmk.textContent}
-------------------------------------
Converter by Sky Creation Innovation`;

        try {
            await copyToClipboard(textToCopy);
            const originalButtonHTML = dom.copyButton.innerHTML;
            dom.copyButton.innerHTML = `<span>✅</span> Copied!`;
            dom.copyButton.disabled = true;
            setTimeout(() => {
                dom.copyButton.innerHTML = originalButtonHTML;
                dom.copyButton.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
            dom.rateHelper.textContent = 'Copy failed. Please try again.';
        }
    }

    function initializeEventListeners() {
        const debouncedCalculate = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(calculateAndDisplay, 250);
        };

        dom.rateInput.addEventListener('input', (e) => {
            formatNumericInput(e);
            debouncedCalculate();
        });
        dom.rateInput.addEventListener('blur', standardizeRate);

        dom.amountInput.addEventListener('input', (e) => {
            formatNumericInput(e);
            debouncedCalculate();
        });
        
        dom.toggleMmktThb.addEventListener('click', () => {
            if (!state.convertToBaht) {
                state.convertToBaht = true;
                updateToggleButtons();
                calculateAndDisplay();
            }
        });
        
        dom.toggleThbMmk.addEventListener('click', () => {
            if (state.convertToBaht) {
                state.convertToBaht = false;
                updateToggleButtons();
                calculateAndDisplay();
            }
        });
        
        dom.clearButton.addEventListener('click', () => {
            dom.rateInput.value = '';
            dom.amountInput.value = '';
            calculateAndDisplay();
            dom.rateInput.focus();
        });

        dom.refreshRateBtn.addEventListener('click', () => fetchAndUpdateRate(true));
        dom.copyButton.addEventListener('click', handleCopy);
    }

    function init() {
        updateClock();
        setInterval(updateClock, 1000);
        updateToggleButtons();
        initializeEventListeners();
        fetchAndUpdateRate(); 
        setInterval(() => fetchAndUpdateRate(false), 300000); 
    }

    init();
});
