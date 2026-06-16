-- svuota le tabelle
truncate table public.players cascade;
truncate table public.teams cascade;

-- inserisci le squadre
insert into public.teams (name) values
  ('Amatori Calcio Genova'),
  ('Tama'),
  ('Mario'),
  ('Sezione 104'),
  ('Montarsolo'),
  ('Dario'),
  ('Taverna'),
  ('UCG (Bairon)'),
  ('Samu Betti'),
  ('chainz Andrea Robbiano'),
  ('Martino Gonzalez');

-- inserisci i giocatori per Amatori Calcio Genova
insert into public.players (name, team_id)
select unnest(array['Rossi L.', 'Ferrari M.', 'Bianchi A.', 'Colombo G.', 'Gallo R.', 'Esposito D.', 'Romano F.', 'Ricci C.', 'Marino S.']), id
from public.teams where name = 'Amatori Calcio Genova';

-- inserisci i giocatori per Tama
insert into public.players (name, team_id)
select unnest(array['Conti P.', 'Bruno T.', 'Russo V.', 'De Luca E.', 'Costa M.', 'Greco N.', 'Rizzo L.', 'Lombardi A.', 'Barbieri G.']), id
from public.teams where name = 'Tama';

-- inserisci i giocatori per Mario
insert into public.players (name, team_id)
select unnest(array['Fontana C.', 'Santoro R.', 'Mariani L.', 'Rinaldi M.', 'Caruso A.', 'Ferretti D.', 'Galli S.', 'Palumbo F.', 'Mancini L.']), id
from public.teams where name = 'Mario';

-- inserisci i giocatori per Sezione 104
insert into public.players (name, team_id)
select unnest(array['Davide Corsini', 'Andrea Dominici', 'Samuele Mangano', 'Filippo Turrini', 'Gabriele Robotti', 'Ivan Grispo', 'Riccardo Mazzolini']), id
from public.teams where name = 'Sezione 104';

-- inserisci i giocatori per Montarsolo
insert into public.players (name, team_id)
select unnest(array['Amato C.', 'Silvestri L.', 'Sanna M.', 'Fabbri P.', 'Marchetti T.', 'De Angelis R.', 'Villa A.', 'Poli G.', 'Gentile S.']), id
from public.teams where name = 'Montarsolo';

-- inserisci i giocatori per Dario
insert into public.players (name, team_id)
select unnest(array['Ferrara M.', 'Neri C.', 'Basile L.', 'Riva T.', 'Croci P.', 'Bianco E.', 'Monti G.', 'Pagano R.', 'Guerra A.']), id
from public.teams where name = 'Dario';

-- inserisci i giocatori per Taverna
insert into public.players (name, team_id)
select unnest(array['Sala M.', 'Benedetti L.', 'Caputo T.', 'Farina P.', 'Rossetti E.', 'Negri G.', 'Pellegrino C.', 'Grassi R.', 'Palermo A.']), id
from public.teams where name = 'Taverna';

-- inserisci i giocatori per UCG (Bairon)
insert into public.players (name, team_id)
select unnest(array['Bairon Carboni', 'Lavagetto Emanuele', 'Lorenzo Ceresoli', 'Fasce Alessandro', 'Reverberi Tommaso', 'Cipolla Luca', 'Baratta Gabriele', 'Bevegni Francesco']), id
from public.teams where name = 'UCG (Bairon)';

-- inserisci i giocatori per Samu Betti
insert into public.players (name, team_id)
select unnest(array['Betti S.', 'Moretti L.', 'Tosi T.', 'Messina P.', 'Coppola E.', 'Sartori G.', 'Rizzi C.', 'Vitali R.', 'Piazza A.']), id
from public.teams where name = 'Samu Betti';

-- inserisci i giocatori per chainz Andrea Robbiano
insert into public.players (name, team_id)
select unnest(array['Robbiano A.', 'Sacco M.', 'Valenti L.', 'Ferretti T.', 'Cini P.', 'Donati E.', 'Proietti G.', 'Milani C.', 'Guerra R.']), id
from public.teams where name = 'chainz Andrea Robbiano';

-- inserisci i giocatori per Martino Gonzalez
insert into public.players (name, team_id)
select unnest(array['Gonzalez M.', 'Moreno L.', 'Alvarez T.', 'Rodriguez P.', 'Garcia E.', 'Lopez G.', 'Martinez C.', 'Sanchez R.', 'Fernandez A.']), id
from public.teams where name = 'Martino Gonzalez';
