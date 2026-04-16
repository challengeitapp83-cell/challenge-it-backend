import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../contexts/theme';

const PAGES: Record<string, { title: string; sections: { h: string; body: string }[] }> = {
  cgu: {
    title: "Conditions Generales d'Utilisation",
    sections: [
      { h: "1. Objet", body: "La plateforme \"Challenge It\" propose des defis entre utilisateurs, avec possibilite de mise financiere volontaire. Les presentes Conditions Generales d'Utilisation (CGU) regissent l'acces et l'utilisation de l'application mobile Challenge It et de l'ensemble de ses services." },
      { h: "2. Acceptation", body: "L'inscription et l'utilisation de l'application impliquent l'acceptation pleine et entiere des presentes conditions. Tout utilisateur qui n'accepte pas ces conditions doit cesser d'utiliser l'application." },
      { h: "3. Conditions d'acces", body: "Pour utiliser Challenge It, l'utilisateur doit :\n\n- Etre age d'au moins 18 ans\n- Disposer de la pleine capacite juridique\n- Fournir des informations exactes et a jour lors de l'inscription\n- Ne pas creer plusieurs comptes\n\nLa plateforme se reserve le droit de demander une verification d'identite a tout moment." },
      { h: "4. Fonctionnement des defis", body: "Les utilisateurs peuvent creer ou rejoindre des defis. Certains defis impliquent une mise financiere volontaire. La participation a tout defi est libre et volontaire. Chaque defi est soumis a des regles specifiques (duree, type de preuve, frequence de validation) que le participant accepte en le rejoignant." },
      { h: "5. Defis avec mise financiere", body: "La participation a un defi avec mise implique un risque financier reel. La somme engagee peut etre integralement perdue en cas de non-respect des conditions du defi. Seuls les utilisateurs ayant respecte l'ensemble des regles du defi peuvent pretendre aux gains. La plateforme preleve une commission de 10% sur les cagnottes redistribuees." },
      { h: "6. Responsabilite de l'utilisateur", body: "Chaque utilisateur est seul responsable de ses actions sur la plateforme. Il s'engage a :\n\n- Respecter les regles de chaque defi rejoint\n- Fournir des preuves authentiques et non falsifiees\n- Ne pas utiliser de moyens frauduleux\n- Respecter les autres utilisateurs" },
      { h: "7. Systeme anti-triche", body: "Challenge It met en place un systeme de verification des preuves, incluant :\n\n- Verification video obligatoire pour les defis avec argent\n- Code de verification quotidien\n- Validation croisee par les participants\n- Score de fiabilite utilisateur\n\nToute fraude ou tentative de fraude entraine :\n- L'exclusion immediate du defi\n- La perte des gains\n- La baisse du score de fiabilite\n- La suspension ou suppression du compte en cas de recidive" },
      { h: "8. Limitation de responsabilite", body: "La plateforme agit en qualite d'intermediaire technique. Elle ne garantit aucun gain. Les pertes financieres resultant de la participation a des defis avec mise relevent de la seule responsabilite de l'utilisateur. La plateforme ne peut etre tenue responsable des litiges entre utilisateurs." },
      { h: "9. Suspension et resiliation", body: "La plateforme se reserve le droit de suspendre ou supprimer tout compte en cas de :\n\n- Violation des presentes CGU\n- Fraude averee ou tentative de fraude\n- Comportement nuisible envers d'autres utilisateurs\n- Non-respect des regles d'un defi\n\nEn cas de suspension, les fonds en cours de defi peuvent etre geles." },
      { h: "10. Propriete intellectuelle", body: "L'ensemble du contenu de l'application (textes, logos, design, code) est la propriete exclusive de Challenge It. Toute reproduction non autorisee est interdite." },
      { h: "11. Droit applicable", body: "Les presentes CGU sont soumises au droit francais. En cas de litige, les tribunaux francais seront competents. L'utilisateur peut egalement recourir a un mediateur de la consommation." },
    ],
  },
  paiement: {
    title: "Politique de Paiement",
    sections: [
      { h: "1. Systeme de paiement", body: "Les paiements sur Challenge It sont securises via Stripe, leader mondial du paiement en ligne. Les donnees bancaires ne sont jamais stockees sur nos serveurs." },
      { h: "2. Mise et cagnotte", body: "Lorsqu'un utilisateur rejoint un defi avec mise, le montant est collecte et place dans une cagnotte securisee. Les fonds sont redistribues aux gagnants a l'issue du defi, apres deduction de la commission plateforme." },
      { h: "3. Commission", body: "La plateforme preleve une commission de 10% sur chaque cagnotte redistribuee. Cette commission couvre les frais de fonctionnement, de securite et de moderation." },
      { h: "4. Remboursements", body: "Sauf cas exceptionnel (erreur technique averee, annulation du defi par la plateforme), les montants engages dans un defi ne sont pas remboursables. La participation etant volontaire, l'utilisateur accepte ce risque avant de rejoindre un defi." },
      { h: "5. Redistribution des gains", body: "Les gains sont redistribues dans les 24 a 72 heures suivant la fin du defi, sous reserve de :\n\n- L'absence de litige actif\n- La validation de toutes les preuves\n- Le respect des regles du defi\n\nEn cas de litige, la cagnotte est gelee jusqu'a resolution." },
      { h: "6. Litiges financiers", body: "En cas de contestation :\n\n- La cagnotte est gelee temporairement\n- Les preuves sont analysees\n- La decision finale appartient a la plateforme\n- L'utilisateur peut contacter le support pour toute reclamation" },
    ],
  },
  confidentialite: {
    title: "Politique de Confidentialite",
    sections: [
      { h: "1. Donnees collectees", body: "Challenge It collecte les donnees suivantes :\n\n- Donnees de compte (nom, email, photo)\n- Donnees d'activite (defis, preuves, progression)\n- Contenus multimedia (photos et videos de preuves)\n- Donnees de paiement (via Stripe, non stockees)\n- Donnees de connexion et d'utilisation" },
      { h: "2. Finalite", body: "Les donnees collectees sont utilisees pour :\n\n- Le fonctionnement de l'application\n- La securite et la prevention de la fraude\n- L'amelioration des services\n- La communication avec l'utilisateur" },
      { h: "3. Stockage et securite", body: "Les donnees sont stockees de maniere securisee. Les preuves multimedia sont hebergees sur des services cloud securises (Cloudinary). Les donnees de paiement sont gerees par Stripe et ne transitent pas par nos serveurs." },
      { h: "4. Partage", body: "Les donnees personnelles ne sont jamais vendues a des tiers. Elles peuvent etre partagees uniquement :\n\n- Avec les participants d'un defi (preuves)\n- Avec nos prestataires techniques (hebergement, paiement)\n- Sur demande des autorites competentes" },
      { h: "5. Droits de l'utilisateur", body: "Conformement au RGPD, l'utilisateur dispose des droits suivants :\n\n- Droit d'acces a ses donnees\n- Droit de rectification\n- Droit a l'effacement\n- Droit a la portabilite\n- Droit d'opposition\n\nPour exercer ces droits : support@challengeit.app" },
      { h: "6. Cookies", body: "L'application utilise des cookies techniques necessaires a son fonctionnement. Aucun cookie publicitaire n'est utilise." },
    ],
  },
};

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { page } = useLocalSearchParams<{ page: string }>();
  const content = PAGES[page || 'cgu'] || PAGES.cgu;

  return (
    <View style={[g.root, { paddingTop: insets.top }]}>
      <View style={g.header}>
        <TouchableOpacity onPress={() => router.back()} style={g.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={g.title} numberOfLines={1}>{content.title}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={g.scroll}>
        <Text style={g.updated}>Derniere mise a jour : Juin 2025</Text>

        {content.sections.map((s, i) => (
          <View key={i} style={g.section}>
            <Text style={g.sectionH}>{s.h}</Text>
            <Text style={g.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={g.footer}>
          <Text style={g.footerT}>Challenge It — Tous droits reserves 2025</Text>
          <Text style={g.footerS}>support@challengeit.app</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(25,30,60,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' };
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C1A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 80 },
  updated: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.25)', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionH: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  sectionBody: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
  footer: { marginTop: 30, alignItems: 'center', gap: 4 },
  footerT: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.2)' },
  footerS: { fontSize: 12, fontWeight: '500', color: '#00D4FF' },
});
