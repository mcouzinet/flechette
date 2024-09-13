
<template>
  <main class="main">
    <div class="general">

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Bulle</th>
            <th>20</th>
            <th>19</th>
            <th>18</th>
            <th>17</th>
            <th>16</th>
            <th>15</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="participant, index in participants" :key="participant.id">
            <th class="caseNom">
            {{ participant.name }}</th>
            <td
              v-for="i in 7"
              class="score"
              :class="['score-' + participant.state[i-1], getState(i)]"
              @click="score(participant.id, i-1)">
              <span></span>
            </td>
          </tr>
        </tbody>


        <tr v-if="participants.length == 0" class="empty"></tr>
      </table>

      <div class="top">
        <form>
          <input type="text" placeholder="nom du participant" v-model="name"/>
          <input type="submit" value="Ajouter" @click.prevent="add"/>
        </form>
        <span @click.prevent="fullscreen" class="full">Fullscreen</span>
        <span @click.prevent="cancel">Annuler</span>
        <span @click.prevent="reset" class="reset">Reset</span>
      </div>
    </div>

    <div class="history">

      <div class="classement">
        <table>
          <tr>
            <th>Nom</th>
            <th>Score</th>
            <th>Diff</th>
          </tr>
          <tr v-for="(participant, index) in participantOrdered" :key="participant.id">
            <td>{{ participant.name }}</td>
            <td>{{ participant.score }}</td>
            <td>{{ index > 0 ? `+${participant.score - participantOrdered[index-1]?.score}` : '' }}</td>
          </tr>
        </table>
      </div>

      <h2>Historique</h2>
      <ul>
        <li v-for="h in [...history].reverse()" :key="h.participant.id">
          <span>{{ h.participant.name }}</span> a marqué <span>{{ h.chiffre }}</span>
        </li>
      </ul>
    </div>
    
  </main>
</template>

<script>
export default {
  name: "Flechette",
  data() {
    return {
      id: 0,
      currentPlayer: 0,
      history: [],
      participants: [
        // {
        //   id: 0,
        //   name: 'Joueur 1',
        //   state: [0, 0, 0, 0, 0, 0, 0],
        //   score: 0
        // },
        // {
        //   id: 1,
        //   name: 'Joueur 2',
        //   state: [0, 0, 0, 0, 0, 0, 0],
        //   score: 0
        // }
      ],
      indexScore: [25, 20, 19, 18, 17, 16, 15],
    };
  },
  computed: {
    participantOrdered: function (id) {
      return [...this.participants].sort((a, b) => a.score - b.score);
    },
    getState() {
      return (index) => {
        for (let i = 0; i < this.participants.length; i++) {
          if (this.participants[i].state[index-1] < 3) {
            return 'opened';
          }
        }
        return 'closed';
      }
    }
  },
  mounted() {
    this.addkeyboardlistener();
  },
  methods: {
    position: function (id) {
      return this.participantOrdered.findIndex((p) => p.id === id) + 1;
    },
    fullscreen: function() {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    },
    addkeyboardlistener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          this.cancel();
        }
        if (e.key === 'ArrowUp') {
          this.currentPlayer = this.currentPlayer === 0 ? this.participants.length - 1 : this.currentPlayer - 1;
        }
        if (e.key === 'ArrowDown') {
          this.currentPlayer = this.currentPlayer === this.participants.length - 1 ? 0 : this.currentPlayer + 1;
        }
      });
    },
    cancel() {
      const last = this.history[this.history.length - 1];
      const participant = last.participant;
      const nbr = last.nbr;
      if (participant.state[nbr] > 3) {
        this.participants.forEach((p) => {
          if (p.state[nbr] < 3) {
            p.score -= this.indexScore[nbr];
          }
        });
      }
      participant.state[nbr] -= 1;
      this.history.pop();
    },
    add() {
      this.participants.push({
        id: this.id++,
        name: this.name,
        state: [0, 0, 0, 0, 0, 0, 0],
        score: 0
      });
      this.name = '';
    },
    reset() {
      this.participants.forEach((p) => {
        p.state = [0, 0, 0, 0, 0, 0, 0];
        p.score = 0;
      });
      this.history = [];
    },
    score(id, nbr) {
      const participant = this.participants.find((p) => p.id === id);
      const chiffre = this.indexScore[nbr];
      this.history.push({ participant, chiffre, nbr });
      if (participant.state[nbr] >= 3) {
        this.participants.forEach((p) => {
          if (p.state[nbr] < 3) {
            p.score += this.indexScore[nbr];
          }
        });
      }
      participant.state[nbr] += 1;

      this.checkWin();
    },
    checkWin() {

      const firstId = this.participantOrdered[0].id;

      this.participants.forEach((p) => {
        console.log('win', firstId, p.state.every((s) => s >= 3), p.id);
        if (p.state.every((s) => s >= 3) && firstId === p.id) {
          console.log('win', p.name);
          alert(`${p.name} a gagné`);
        }
      });
    }
  },
};
</script>

<style scoped lang="scss">

main {
  background-color: #000;
  min-height: 100vh;
  display: flex;
  justify-content: space-between;
  color: #2d3171;
}

table {
  border-collapse: collapse;
  margin: 0 auto 0;
  background-color: #FFF;
  width: 100%;
  height: 100%;
}

thead {
  height: 100px;
}

th {
  font-weight: 900;
  font-size: 24px;
  border-spacing: 0px;
  min-width: 75px;
  text-align: center;
  border: 2px solid black;
  height: 50px;
  background: #2d3171;
  color: #FFF;
  max-height: 50px;
}

.empty {
  height: 50%;
}

tbody th{
  background-color: #464646;
}

td {
  border: 2px solid black;
  border-spacing: 0px;
  border-collapse: separate;
  text-align: center;

  &:active {
    background: #136f22;
  }
  &:hover {
    box-shadow: inset 0 2px 3px rgba($color: #000000, $alpha: 0.5);
  }
  &.closed {
    background: #282828;

    span {
      border-color: #dcdcdc;
      &:before,
      &:after {
        background-color: #dcdcdc;
      }
    }
  }
}

.score {
  cursor: pointer;
  position: relative;
  height: 75px;
  background-color: rgba($color: #0f6b21, $alpha: 0.7);

  span {
    display: block;
    border: 6px solid black;
    border-radius: 120px;
    height: 75px;
    width: 100%;
    max-width: 75px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);

    &:before,
    &:after {
      position: absolute;
      top: 50%;
      left: 50%;
      content: '';
      display: block;
      width: 8px;
      border-radius: 3px;
      height: 50px;
      background-color: black;
      transform: translate3d(-50%, -50%, 0) rotate(45deg);
      opacity: 1;
    }

    &:before {
      transform: translate3d(-50%, -50%, 0) rotate(-45deg);
    }
  }
}



.score-2 {
  background-color: rgba($color: #0f6b21, $alpha: 0.3);
  span {
    border-color: transparent;
  }
} 

.score-1 {
  background-color: rgba($color: #0f6b21, $alpha: 0.15);
  span {
    border-color: transparent;
    &:before {
      opacity: 0;
    }
  }
}

.score-0 {
  background-color: #fff;
  span {
    border-color: transparent;
    &:after,
    &:before {
      opacity: 0;
    }
  }
} 

.caseNom {
  font-size: 28px;
  font-weight: 900;
  padding: 0 10px;

  &.current {
    background-color: #2d3171;
    color: #FFF;
  }
} 

.general {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
}

.top {
  display: flex;
  margin-top: auto;
  display: flex;
  background: #2d3171;
  justify-content: center;

  span {
    color: white;
    width: 100px;
    background-color: #d21953;
    text-align: center;
    font-size: 20px;
    line-height: 50px;
    border-radius: 5px;
    margin: 3px;
    cursor: pointer;

    &.full {
      background-color: #0f6b21;
    }
  }

  .reset {
    margin-left: auto;
    background-color: #000;
  }

  input {
    flex: 1 0 auto;
    height: 50px;
    font-size: 20px;
    padding: 0 10px;
    border: 0;
    border-radius: 5px;
    margin: 3px;
  }
}


.total {
  font-weight: 900;
  font-size: 24px;
  border-spacing: 0px;
  min-width: 90px;
  text-align: center;
  color: #515cb7;
}

.history {
  position: relative;
  max-height: 100vh;
  background-color: #FFF;
  text-align: left;
  display: flex;
  flex-direction: column;

  h2 {
    border-bottom: 2px solid black;
    text-transform: uppercase;
    font-weight: 900;
    text-align: center;
    border-left: 2px solid black;
  }

  ul {
    overflow-y: scroll;
    padding: 15px 10px;
    border-left: 2px solid black;
    height: 100%;
  }

  li {
    display: block;
    font-size: 14px;
    text-align: center;

    span {
      font-weight: 900;
    }

    &:first-of-type { font-size: 22px; }
    &:nth-child(2) { font-size: 20px; }
    &:nth-child(3) { font-size: 18px; }
    &:nth-child(4) { font-size: 16px; }
  }
}

.classement {
  margin-right: 0;
  background-color: #FFF;
  min-width: 250px;

  table {
    margin: 0;
    width: 100%;
  }

  td {
    font-size: 16px;
    font-weight: 900;

    &:first-of-type {
      font-size: 14px;
      font-weight: 700;
      color: #515cb7;
    }

    &:nth-child(2) {
      font-size: 24px;
      color: #d21953;
    }
  }
}


</style>
