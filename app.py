import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Meu Boletim - Ciência de Dados", page_icon="🎓", layout="wide")

# Carregar dados
@st.cache_data
def load_data():
    df = pd.read_csv('notas.csv')
    return df

df = load_data()

# --- MENU LATERAL ---
st.sidebar.title("Filtros")
semestre_selecionado = st.sidebar.selectbox(
    "Escolha o Semestre:",
    options=df['Semestre'].unique()
)

# Filtrar os dados pelo semestre escolhido
df_filtrado = df[df['Semestre'] == semestre_selecionado].copy()
df_filtrado['Status'] = df_filtrado['Media_Final'].apply(lambda x: 'Acima da Média' if x >= 7.0 else 'Abaixo da Média')

# --- CABEÇALHO ---
st.title("🎓 Desempenho Acadêmico - Ciência de Dados")
st.subheader(f"Semestre {semestre_selecionado}")
st.divider()

# --- CARDS DE MÉTRICAS ---
media_geral = df_filtrado['Media_Final'].mean()
acima = len(df_filtrado[df_filtrado['Media_Final'] >= 7.0])
abaixo = len(df_filtrado[df_filtrado['Media_Final'] < 7.0])

col1, col2, col3 = st.columns(3)
col1.metric("Média Geral do Semestre", f"{media_geral:.2f}")
col2.metric("Disciplinas na Média ou Acima", acima)
col3.metric("Disciplinas Abaixo da Média", abaixo)

st.divider()

# --- GRÁFICOS ---
col_esq, col_dir = st.columns([1.5, 1])

with col_esq:
    st.subheader("📊 Média Final por Disciplina")
    fig_bar = px.bar(
        df_filtrado, x='Disciplina', y='Media_Final',
        color='Status',
        color_discrete_map={'Acima da Média': '#2ca02c', 'Abaixo da Média': '#d62728'},
        text_auto='.2f'
    )
    fig_bar.add_hline(y=7.0, line_dash="dash", line_color="gray", annotation_text="Média (7.0)")
    fig_bar.update_layout(xaxis_title="", yaxis_title="Nota")
    st.plotly_chart(fig_bar, use_container_width=True)

with col_dir:
    st.subheader("🍩 Distribuição")
    status_counts = df_filtrado['Status'].value_counts().reset_index()
    status_counts.columns = ['Status', 'Quantidade']
    fig_pie = px.pie(
        status_counts, names='Status', values='Quantidade', hole=0.6,
        color='Status', color_discrete_map={'Acima da Média': '#2ca02c', 'Abaixo da Média': '#d62728'}
    )
    st.plotly_chart(fig_pie, use_container_width=True)

st.divider()

# --- TABELA DE DADOS ---
st.subheader("📋 Detalhamento das Notas")
st.dataframe(df_filtrado[['Disciplina', 'Media_Final', 'Status']], use_container_width=True)

# --- INSIGHTS ---
st.subheader("💡 Insights Automáticos")
if abaixo > 0:
    st.warning(f"Você tem {abaixo} disciplina(s) abaixo da média. Foco nos estudos para recuperar!")
else:
    st.success("Parabéns! Você está acima da média em todas as disciplinas.")