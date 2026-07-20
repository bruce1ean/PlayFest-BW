const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');
code = code.replace(/const handleAttendeeLookup[\s\S]*?const handleOrganizerLogin/g, `const handleAttendeeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      sounds.playCancel();
      addToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    sounds.playHover();

    try {
      const credential = await loginUser(email.trim(), password);
      const regs = await storage.getRegistrations();
      const match = regs.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());
      
      if (match) {
        sounds.playSuccess();
        addToast('Welcome back! Your ticket has been retrieved successfully.', 'success');
        onSuccessAttendee(match);
      } else {
        sounds.playSuccess();
        addToast('Logged in successfully! Welcome to PlayFest.', 'success');
        onSuccessAttendee({
          id: credential.user.uid,
          fullName: email.split('@')[0],
          email: email.trim(),
          phone: 'N/A',
          city: 'N/A',
          interests: ['General Interest'],
        } as any);
      }
    } catch (authErr: any) {
      if (authErr.code === 'auth/operation-not-allowed') {
        try {
          const isValidCred = await (storage as any).verifyFallbackCredential(email.trim(), password);
          const regs = await storage.getRegistrations();
          const match = regs.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());
          
          if (match) {
            const storedCreds = JSON.parse(localStorage.getItem('playfest_fallback_credentials') || '{}');
            const hasCredential = !!storedCreds[email.trim().toLowerCase()];
            if (hasCredential && !isValidCred) {
              sounds.playCancel();
              addToast('Incorrect password. Please try again.', 'error');
              setLoading(false);
              return;
            }
            sounds.playSuccess();
            addToast('Welcome back! Verified & retrieved your ticket (Guest Fallback Mode).', 'success');
            onSuccessAttendee(match);
            setLoading(false);
            return;
          }
        } catch (fallbackErr) {
          console.error(fallbackErr);
        }
      }

      console.error('Firebase Auth Login failed:', authErr);
      let friendlyMessage = 'Authentication failed. Please check your credentials.';
      if (authErr.code === 'auth/wrong-password') {
        friendlyMessage = 'Incorrect password. Please try again.';
      } else if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        friendlyMessage = 'No account found with this email. Please register.';
      }
      addToast(friendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerLogin`);
fs.writeFileSync('src/components/LoginPage.tsx', code);
