import { useLocation, useNavigate } from 'react-router-dom';
import { ForcePasswordChange } from '../components/ForcePasswordChange';

export function ForcePasswordChangePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, userEmail } = location.state || {};

  // Si pas de données, rediriger vers login
  if (!userId || !userEmail) {
    navigate('/login');
    return null;
  }

  const handlePasswordChanged = () => {
    // Rediriger vers le dashboard après changement
    alert('Mot de passe changé avec succès ! Vous allez être redirigé.');
    navigate('/client/dashboard');
  };

  return (
    <ForcePasswordChange
      userId={userId}
      userEmail={userEmail}
      onPasswordChanged={handlePasswordChanged}
    />
  );
}